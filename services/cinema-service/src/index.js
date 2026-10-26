require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'cinema-service';
const PORT = process.env.PORT || 4003;
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

// GET all cinemas
app.get('/cinemas', async (req, res) => {
  try {
    const { city, is_active } = req.query;
    let query = supabase.from('cinemas').select('*');
    
    if (city) query = query.eq('city', city);
    if (is_active) query = query.eq('is_active', is_active === 'true');
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single cinema by ID
app.get('/cinemas/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cinemas')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Cinema not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new cinema (protected)
app.post('/cinemas', authenticateToken, async (req, res) => {
  try {
    const { name, location, city, phone, email, total_halls } = req.body;
    
    const { data, error } = await supabase
      .from('cinemas')
      .insert({
        name,
        location,
        city,
        phone,
        email,
        total_halls: total_halls || 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update cinema (protected)
app.put('/cinemas/:id', authenticateToken, async (req, res) => {
  try {
    const { name, location, city, phone, email, total_halls, is_active } = req.body;
    
    const { data, error } = await supabase
      .from('cinemas')
      .update({
        name,
        location,
        city,
        phone,
        email,
        total_halls,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Cinema not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE cinema (protected)
app.delete('/cinemas/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('cinemas')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Cinema deleted successfully' });
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
