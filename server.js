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

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ================== RUTA FINALIZAR COMPRA ==================
app.post('/api/finalizar-compra', async (req, res) => {
  const { nombre, email, telefono, direccion, metodoPago, total } = req.body;

  if (!nombre || !email || !telefono || !direccion || !metodoPago || !total) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  try {
    // Guardar en base de datos
    await pool.query(
      `INSERT INTO ventas (nombre, email, telefono, direccion, metodo_pago, total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nombre, email, telefono, direccion, metodoPago, total]
    );

    // Configuración del correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Correo para la dueña
    const ownerMail = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: '🛒 Nueva compra realizada',
      html: `
        <h2>Nueva compra</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Dirección:</strong> ${direccion}</p>
        <p><strong>Método de pago:</strong> ${metodoPago}</p>
        <p><strong>Total:</strong> ₡${total}</p>
      `
    };

    // Correo para el cliente
    const customerMail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '✅ Confirmación de tu pedido',
      html: `
        <h2>Gracias por tu compra 💖</h2>
        <p>Hola ${nombre},</p>
        <p>Hemos recibido tu pedido correctamente.</p>
        <p><strong>Total:</strong> ₡${total}</p>
        <p><strong>Método de pago:</strong> ${metodoPago}</p>
        <p>Nos comunicaremos contigo muy pronto.</p>
        <br>
        <p>✨ AVS Store ✨</p>
      `
    };

    // Enviar correos
    await transporter.sendMail(ownerMail);
    await transporter.sendMail(customerMail);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error en finalizar-compra:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ================== PUERTO ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
