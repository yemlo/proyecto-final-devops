const express = require("express");
const { Pool } = require("pg");
const client = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// CONFIGURACION PROMETHEUS
// =========================
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

const httpRequestCounter = new client.Counter({
  name: "app_http_requests_total",
  help: "Total de peticiones HTTP recibidas por la aplicacion",
  labelNames: ["method", "route", "status"],
});

register.registerMetric(httpRequestCounter);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });

  next();
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).send("Error obteniendo metricas");
  }
});

// =========================
// CONFIGURACION POSTGRESQL
// =========================
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

  console.log("Base de datos inicializada correctamente");
}

initDB().catch((error) => {
  console.error("Error inicializando base de datos:", error);
});

// =========================
// RUTA PRINCIPAL
// =========================
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notas ORDER BY id DESC");

    const notasHTML = result.rows
      .map(
        (nota) => `
          <div class="nota">
            <h3>${nota.titulo}</h3>
            <p>${nota.contenido}</p>
            <small>${new Date(nota.fecha).toLocaleString()}</small>

            <form method="POST" action="/notas/${nota.id}/delete">
              <button class="btn-delete" type="submit">Eliminar</button>
            </form>
          </div>
        `
      )
      .join("");

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Aplicacion de Notas - DevOps</title>

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
            padding: 25px;
            text-align: center;
          }

          header h1 {
            margin: 0;
            font-size: 34px;
          }

          header p {
            margin-top: 10px;
            font-size: 16px;
          }

          .container {
            width: 90%;
            max-width: 950px;
            margin: 30px auto;
          }

          .estado {
            background: #d1fae5;
            color: #065f46;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: bold;
          }

          .info {
            background: #e0f2fe;
            color: #075985;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
          }

          form {
            background: white;
            padding: 22px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 25px;
          }

          label {
            font-weight: bold;
          }

          input, textarea {
            width: 100%;
            padding: 11px;
            margin-top: 8px;
            margin-bottom: 15px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 15px;
            box-sizing: border-box;
          }

          button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 11px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 15px;
          }

          button:hover {
            background: #1d4ed8;
          }

          .notas-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .contador {
            background: #1f2937;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
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
            color: #1f2937;
          }

          .nota p {
            color: #374151;
            white-space: pre-wrap;
          }

          .nota small {
            color: #6b7280;
          }

          .btn-delete {
            background: #dc2626;
            margin-top: 12px;
          }

          .btn-delete:hover {
            background: #b91c1c;
          }

          .sin-notas {
            background: white;
            padding: 20px;
            border-radius: 8px;
            color: #6b7280;
            text-align: center;
          }

          footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>

      <body>
        <header>
          <h1>Aplicacion de Notas</h1>
          <p>Proyecto Final DevOps - Docker, Docker Swarm, CI/CD, PostgreSQL, Prometheus y Grafana</p>
        </header>

        <div class="container">
          <div class="estado">
            Estado: Aplicacion funcionando correctamente con PostgreSQL.
          </div>

          <div class="info">
            Esta aplicacion esta desplegada en Google Cloud Platform mediante Docker Swarm.
            Las notas se almacenan en PostgreSQL y la aplicacion expone metricas para Prometheus en la ruta <strong>/metrics</strong>.
          </div>

          <form method="POST" action="/notas">
            <h2>Crear nueva nota</h2>

            <label>Titulo:</label>
            <input type="text" name="titulo" required placeholder="Ingrese el titulo de la nota">

            <label>Contenido:</label>
            <textarea name="contenido" rows="5" required placeholder="Ingrese el contenido de la nota"></textarea>

            <button type="submit">Guardar nota</button>
          </form>

          <div class="notas-header">
            <h2>Notas registradas</h2>
            <span class="contador">Total: ${result.rows.length}</span>
          </div>

          ${
            notasHTML ||
            '<div class="sin-notas">No hay notas registradas todavia.</div>'
          }
        </div>

        <footer>
          Proyecto Final - Sistemas Operativos II
        </footer>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error consultando notas:", error);
    res.status(500).send("Error consultando notas");
  }
});

// =========================
// CREAR NOTA
// =========================
app.post("/notas", async (req, res) => {
  try {
    const { titulo, contenido } = req.body;

    await pool.query(
      "INSERT INTO notas (titulo, contenido) VALUES ($1, $2)",
      [titulo, contenido]
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error creando nota:", error);
    res.status(500).send("Error creando nota");
  }
});

// =========================
// ELIMINAR NOTA
// =========================
app.post("/notas/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM notas WHERE id = $1", [id]);

    res.redirect("/");
  } catch (error) {
    console.error("Error eliminando nota:", error);
    res.status(500).send("Error eliminando nota");
  }
});

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Aplicacion de notas funcionando correctamente",
  });
});

// =========================
// INICIAR SERVIDOR
// =========================
app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});