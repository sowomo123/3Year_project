require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'hall-service';
const PORT = process.env.PORT || 4006;
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

// GET all halls
app.get('/halls', async (req, res) => {
  try {
    const { cinema_id, is_active } = req.query;
    let query = supabase.from('halls').select('*');
    
    if (cinema_id) query = query.eq('cinema_id', cinema_id);
    if (is_active) query = query.eq('is_active', is_active === 'true');
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single hall by ID
app.get('/halls/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new hall (protected)
app.post('/halls', authenticateToken, async (req, res) => {
  try {
    const { cinema_id, name, total_seats, rows, seats_per_row, hall_type } = req.body;
    
    const { data, error } = await supabase
      .from('halls')
      .insert({
        cinema_id,
        name,
        total_seats,
        rows,
        seats_per_row,
        hall_type: hall_type || 'standard',
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update hall (protected)
app.put('/halls/:id', authenticateToken, async (req, res) => {
  try {
    const { name, total_seats, rows, seats_per_row, hall_type, is_active } = req.body;
    
    const { data, error } = await supabase
      .from('halls')
      .update({
        name,
        total_seats,
        rows,
        seats_per_row,
        hall_type,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE hall (protected)
app.delete('/halls/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('halls')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Hall deleted successfully' });
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
