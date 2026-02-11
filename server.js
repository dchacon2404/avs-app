require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));

// ================== Rutas ==================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'Public', 'index.html')));
app.get('/Producto.html', (req, res) => res.sendFile(path.join(__dirname, 'Public', 'Producto.html')));

// 🔹 Obtener solo productos disponibles
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos");
    const productos = result.rows.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      talla: p.talla,
      imagenes: JSON.parse(p.imagenes)
    }));
    res.json(productos);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).send("Error al obtener productos");
  }
});

// 🔹 Obtener producto por ID (solo si está disponible)
app.get('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
    "SELECT * FROM productos WHERE id = $1",
    [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Producto no disponible");
    }
    const p = result.rows[0];
    res.json({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      talla: p.talla,
      imagenes: JSON.parse(p.imagenes)
    });
  } catch (err) {
    console.error("❌ Error al obtener producto:", err);
    res.status(500).send("Error al obtener producto");
  }
});

// 🔥 NUEVO: Marcar producto como vendido
app.put('/api/productos/:id/vender', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE productos SET estado = false WHERE id = $1",
      [id]
    );
    res.json({ message: "Producto marcado como vendido" });
  } catch (err) {
    console.error("❌ Error al marcar como vendido:", err);
    res.status(500).send("Error al actualizar producto");
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
