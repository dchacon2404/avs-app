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

// ================== PRODUCTOS ==================
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos');
    const productos = result.rows.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      estado: p.estado,
      talla: p.talla,
      imagenes: JSON.parse(p.imagenes)
    }));
    res.json(productos);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).send("Error al obtener productos");
  }
});

app.get('/api/productos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).send('Producto no encontrado');

    const p = result.rows[0];
    res.json({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      estado: p.estado,
      talla: p.talla,
      imagenes: JSON.parse(p.imagenes)
    });
  } catch (err) {
    console.error("❌ Error al obtener producto:", err);
    res.status(500).send("Error al obtener producto");
  }
});

// ================== ENVÍO DE CORREOS ==================
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/enviar-correo', async (req, res) => {
  const { cliente, productosTexto, total, deliveryType } = req.body;

  if (!cliente || !productosTexto || !total) {
    return res.status(400).json({ message: "Faltan datos para enviar el correo" });
  }

  const mailOptionsCliente = {
    from: process.env.EMAIL_USER,
    to: cliente.email,
    subject: 'Compra exitosa ✅',
    html: `
      <h2>Hola ${cliente.nombre} ${cliente.apellidos}</h2>
      <p>Tu compra ha sido exitosa.</p>
      <p><strong>Productos:</strong> ${productosTexto}</p>
      <p><strong>Total:</strong> ₡${total}</p>
      <p>Gracias por tu compra 😊</p>
    `
  };

  const mailOptionsTienda = {
    from: process.env.EMAIL_USER,
    to: 'CORREO_DE_TU_NOVIA@gmail.com', // ⬅️ CAMBIA ESTO
    subject: 'Nuevo pedido recibido',
    html: `
      <h2>Nuevo pedido</h2>
      <p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellidos}</p>
      <p><strong>Email:</strong> ${cliente.email}</p>
      <p><strong>Tipo de entrega:</strong> ${deliveryType === "pickup" ? "Recolectar" : "Envío a domicilio"}</p>
      <p><strong>Productos:</strong> ${productosTexto}</p>
      <p><strong>Total:</strong> ₡${total}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptionsCliente);
    await transporter.sendMail(mailOptionsTienda);
    res.status(200).json({ message: 'Correos enviados con éxito' });
  } catch (err) {
    console.error("❌ Error enviando correos:", err);
    res.status(500).json({ message: 'Error enviando correos' });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
