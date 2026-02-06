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

// ================== ENVÍO DE PEDIDOS ==================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/pedido', async (req, res) => {
  try {
    const { cliente, productos, total, deliveryType } = req.body;

    const productosTexto = productos.map(p =>
      `${p.name} - Talla: ${p.talla} - Cantidad: ${p.cantidad} - ₡${p.price}`
    ).join('\n');

    // 📧 Correo al cliente
    const mailCliente = {
      from: `"AVS Store" <${process.env.EMAIL_USER}>`,
      to: cliente.email,
      subject: 'Confirmación de tu pedido - AVS',
      text: `
Hola ${cliente.nombre},

Gracias por tu compra en AVS ❤️

📦 Detalles del pedido:
${productosTexto}

💰 Total: ₡${total.toLocaleString()}

Tipo de entrega: ${deliveryType === "pickup" ? "Recolectar" : "Envío a domicilio"}

Te contactaremos pronto para coordinar.

— AVS
      `,
    };

    // 📧 Correo al dueño
    const mailOwner = {
      from: `"AVS Store" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: '🛒 Nuevo pedido recibido',
      text: `
Nuevo pedido recibido:

👤 Cliente: ${cliente.nombre} ${cliente.apellidos}
📧 Email: ${cliente.email}
📞 Teléfono: ${cliente.telefono}

📦 Productos:
${productosTexto}

💰 Total: ₡${total.toLocaleString()}

Tipo de entrega: ${deliveryType === "pickup" ? "Recolectar" : "Envío a domicilio"}

Dirección:
${cliente.direccion || "No aplica"}
      `,
    };

    await transporter.sendMail(mailCliente);
    await transporter.sendMail(mailOwner);

    res.status(200).json({ message: 'Correos enviados correctamente' });

  } catch (error) {
    console.error('❌ Error enviando correos:', error);
    res.status(500).json({ error: 'Error al enviar correos' });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
