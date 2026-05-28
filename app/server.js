const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <h1>Proyecto Final DevOps</h1>
    <h2>Sistemas Operativos II</h2>
    <p>Aplicacion desplegada en la nube usando Docker, Docker Swarm y CI/CD.</p>
    <p>Estado: funcionando correctamente.</p>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "La aplicacion esta funcionando correctamente"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});