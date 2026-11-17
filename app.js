const express = require("express");
const pool = require("./db"); // Подключение к базе данных из db/index.js

const app = express();
const port = process.env.PORT || 3000;

// Middleware для разбора JSON в теле запроса
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Express работает! API для студентов.");
});

app.get("/api/info", (req, res) => {
    res.json({
        application: "Web Technologies",
        technology: "Node.js + Express",
        database: "PostgreSQL",
        entity: "Student"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка подключения к базе данных" });
    }
});

// 1. Получить список всех студентов (Read)
app.get("/api/students", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT "Id", "FullName", "Specialty", "Course", "AverageGrade", "IsEnrolled", "CreatedAt" 
             FROM "Students" 
             ORDER BY "Id"`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения списка студентов" });
    }
});

// 2. Получить одного студента по ID (Read)
app.get("/api/students/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await pool.query(
            `SELECT * FROM "Students" WHERE "Id" = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Студент не найден" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения студента" });
    }
});

// 3. Создать нового студента (Create)
app.post("/api/students", async (req, res) => {
    try {
        const { fullName, specialty, course, averageGrade, isEnrolled } = req.body;

        // Валидация входных данных
        if (!fullName || !specialty || course === undefined || averageGrade === undefined) {
            return res.status(400).json({ error: "Некорректные данные студента. Проверьте поля." });
        }

        const result = await pool.query(
            `INSERT INTO "Students" ("FullName", "Specialty", "Course", "AverageGrade", "IsEnrolled", "CreatedAt") 
             VALUES ($1, $2, $3, $4, $5, NOW()) 
             RETURNING *`,
            [fullName, specialty, course, averageGrade, isEnrolled || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка создания студента" });
    }
});

// 4. Обновить данные студента (Update)
app.put("/api/students/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { fullName, specialty, course, averageGrade, isEnrolled } = req.body;

        const result = await pool.query(
            `UPDATE "Students" 
             SET "FullName" = $1, "Specialty" = $2, "Course" = $3, "AverageGrade" = $4, "IsEnrolled" = $5 
             WHERE "Id" = $6 
             RETURNING *`,
            [fullName, specialty, course, averageGrade, isEnrolled, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Студент не найден" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка обновления данных студента" });
    }
});

// 5. Удалить студента (Delete)
app.delete("/api/students/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await pool.query(
            `DELETE FROM "Students" WHERE "Id" = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Студент не найден" });
        }

        res.json({
            message: "Студент удалён",
            student: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка удаления студента" });
    }
});

// Поиск студентов по ФИО (Read)
app.get("/api/students/search", async (req, res) => {
    try {
        const name = req.query.name || "";
        const result = await pool.query(
            `SELECT * FROM "Students" WHERE "FullName" ILIKE $1 ORDER BY "Id"`,
            [`%${name}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка поиска студентов" });
    }
});

// Обработчик неизвестного маршрута (404)
app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден" });
});


app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port ${port}`);
});