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

// 🔥 Ruta explícita para producto.html (esto arregla el error)
app.get('/producto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'producto.html'));
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

    const pedidoResult = await pool.query(
      `
      INSERT INTO pedidos 
      (nombre, apellidos, telefono, direccion, provincia, ciudad, codigopostal, deliverytype, total, fecha)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING id
      `,
      [
        cliente.nombre,
        cliente.apellidos,
        cliente.telefono,
        cliente.direccion || null,
        cliente.provincia || null,
        cliente.ciudad || null,
        cliente.codigoPostal || null,
        deliveryType,
        total
      ]
    );

    const pedidoId = pedidoResult.rows[0].id;

    for (const p of productos) {
      await pool.query(
        `
        INSERT INTO pedidoproductos (pedidoid, productoid, cantidad, precio)
        VALUES ($1,$2,$3,$4)
        `,
        [pedidoId, p.id, p.cantidad, p.price]
      );

      await pool.query(
        `
        UPDATE productos
        SET estado = 'Vendido'
        WHERE id = $1 AND TRIM(estado) = 'Disponible'
        `,
        [p.id]
      );
    }

    res.json({ message: 'Pedido guardado correctamente', pedidoId });

  } catch (err) {
    console.error("❌ Error al guardar pedido:", err);
    res.status(500).send("Error al guardar el pedido");
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
