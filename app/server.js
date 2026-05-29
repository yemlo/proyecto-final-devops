const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "admin123",
  database: process.env.DB_NAME || "proyecto_devops",
  port: 5432,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notas (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      contenido TEXT NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDB().catch((error) => {
  console.error("Error inicializando base de datos:", error);
});

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM notas ORDER BY id DESC");

  const notasHTML = result.rows.map(nota => `
    <div class="nota">
      <h3>${nota.titulo}</h3>
      <p>${nota.contenido}</p>
      <small>${new Date(nota.fecha).toLocaleString()}</small>
      <form method="POST" action="/notas/${nota.id}/delete">
        <button class="btn-delete" type="submit">Eliminar</button>
      </form>
    </div>
  `).join("");

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Aplicación de Notas - DevOps</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f8;
          margin: 0;
          padding: 0;
        }
        header {
          background: #1f2937;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .container {
          width: 90%;
          max-width: 900px;
          margin: 30px auto;
        }
        form {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 25px;
        }
        input, textarea {
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 15px;
        }
        button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
        }
        button:hover {
          background: #1d4ed8;
        }
        .nota {
          background: white;
          padding: 18px;
          border-left: 6px solid #2563eb;
          border-radius: 8px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .nota h3 {
          margin-top: 0;
        }
        .btn-delete {
          background: #dc2626;
          margin-top: 10px;
        }
        .btn-delete:hover {
          background: #b91c1c;
        }
        .estado {
          background: #d1fae5;
          color: #065f46;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>Aplicación de Notas</h1>
        <p>Proyecto Final DevOps - Docker, Swarm, CI/CD y Google Cloud</p>
      </header>

      <div class="container">
        <div class="estado">
          Estado: Aplicación funcionando correctamente con PostgreSQL.
        </div>

        <form method="POST" action="/notas">
          <h2>Crear nueva nota</h2>
          <label>Título:</label>
          <input type="text" name="titulo" required>

          <label>Contenido:</label>
          <textarea name="contenido" rows="5" required></textarea>

          <button type="submit">Guardar nota</button>
        </form>

        <h2>Notas registradas</h2>
        ${notasHTML || "<p>No hay notas registradas todavía.</p>"}
      </div>
    </body>
    </html>
  `);
});

app.post("/notas", async (req, res) => {
  const { titulo, contenido } = req.body;

  await pool.query(
    "INSERT INTO notas (titulo, contenido) VALUES ($1, $2)",
    [titulo, contenido]
  );

  res.redirect("/");
});

app.post("/notas/:id/delete", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM notas WHERE id = $1", [id]);

  res.redirect("/");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Aplicacion de notas funcionando correctamente",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});