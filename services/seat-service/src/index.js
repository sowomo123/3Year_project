require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'seat-service';
const PORT = process.env.PORT || 4007;
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

// GET all seats
app.get('/seats', async (req, res) => {
  try {
    const { hall_id, is_active } = req.query;
    let query = supabase.from('seats').select('*');
    
    if (hall_id) query = query.eq('hall_id', hall_id);
    if (is_active) query = query.eq('is_active', is_active === 'true');
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single seat by ID
app.get('/seats/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Seat not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new seat (protected)
app.post('/seats', authenticateToken, async (req, res) => {
  try {
    const { hall_id, row_number, seat_number, seat_type, price_multiplier } = req.body;
    
    const { data, error } = await supabase
      .from('seats')
      .insert({
        hall_id,
        row_number,
        seat_number,
        seat_type: seat_type || 'regular',
        price_multiplier: price_multiplier || 1.0,
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update seat (protected)
app.put('/seats/:id', authenticateToken, async (req, res) => {
  try {
    const { row_number, seat_number, seat_type, price_multiplier, is_active } = req.body;
    
    const { data, error } = await supabase
      .from('seats')
      .update({
        row_number,
        seat_number,
        seat_type,
        price_multiplier,
        is_active,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Seat not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE seat (protected)
app.delete('/seats/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('seats')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Seat deleted successfully' });
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
