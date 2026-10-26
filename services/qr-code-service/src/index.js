require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'qr-code-service';
const PORT = process.env.PORT || 4012;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Health check
app.get('/health', (req, res) => {
  res.json({ service: SERVICE_NAME, status: 'ok' });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Generate QR code for a ticket
app.post('/qr-codes/generate', authenticateToken, async (req, res) => {
  try {
    const { ticket_id } = req.body;
    
    const qrCode = crypto.randomBytes(32).toString('hex');
    
    const { data, error } = await supabase
      .from('tickets')
      .update({ qr_code: qrCode })
      .eq('id', ticket_id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      qr_code: qrCode,
      ticket_id: data.id,
      ticket_number: data.ticket_number,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate QR code
app.get('/qr-codes/validate/:qr_code', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, bookings(*), showtimes(*, movies(*)), seats(*), users(*)')
      .eq('qr_code', req.params.qr_code)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }
    
    res.json({
      valid: true,
      is_scanned: data.is_scanned,
      ticket: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark QR code as scanned
app.put('/qr-codes/:qr_code/scan', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        is_scanned: true,
        scanned_at: new Date().toISOString(),
      })
      .eq('qr_code', req.params.qr_code)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    
    res.json({
      message: 'QR code scanned successfully',
      ticket: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
