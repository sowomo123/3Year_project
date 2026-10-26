require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'payment-service';
const PORT = process.env.PORT || 4009;
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

// GET all payments
app.get('/payments', async (req, res) => {
  try {
    const { booking_id, user_id, payment_status } = req.query;
    let query = supabase.from('payments').select('*, bookings(*), users(*)');
    
    if (booking_id) query = query.eq('booking_id', booking_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (payment_status) query = query.eq('payment_status', payment_status);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single payment by ID
app.get('/payments/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, bookings(*), users(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new payment (protected)
app.post('/payments', authenticateToken, async (req, res) => {
  try {
    const { booking_id, amount, payment_method, transaction_id, payment_gateway_response } = req.body;
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id,
        user_id: req.user.userId,
        amount,
        payment_method,
        transaction_id,
        payment_gateway_response,
        payment_status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update payment status (protected)
app.put('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { payment_status, payment_gateway_response, transaction_id } = req.body;
    
    const updateData = {
      payment_status,
      payment_gateway_response,
      transaction_id,
    };
    
    if (payment_status === 'completed') {
      updateData.paid_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE payment (protected)
app.delete('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Payment deleted successfully' });
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
