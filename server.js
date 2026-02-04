require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde Public
app.use(express.static(path.join(__dirname, 'Public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// 🔥 Ruta explícita para Producto.html (con P mayúscula)
app.get('/Producto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'Producto.html'));
});

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
    const result = await pool.query(
      'SELECT * FROM productos WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }

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

// ================== PEDIDOS ==================

app.post('/api/pedidos', async (req, res) => {
  try {
    const { cliente, deliveryType, productos, total } = req.body;

    // Aquí puedes guardar en base de datos si quieres
    // await pool.query(...)

    // Enviar a n8n
    const response = await fetch('http://localhost:5678/webhook/7e0fd77e-e434-4df4-93ce-bf3d666d462b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente,
        deliveryType,
        productos,
        total,
        fecha: new Date().toLocaleString()
      })
    });

    if (!response.ok) {
      throw new Error('Error al enviar pedido a n8n');
    }

    res.json({ success: true, message: 'Pedido procesado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al procesar el pedido' });
  }
});


// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
