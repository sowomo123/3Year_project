require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'discount-service';
const PORT = process.env.PORT || 4010;
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

// GET all discounts
app.get('/discounts', async (req, res) => {
  try {
    const { is_active, code } = req.query;
    let query = supabase.from('discounts').select('*');
    
    if (is_active) query = query.eq('is_active', is_active === 'true');
    if (code) query = query.eq('code', code);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single discount by ID
app.get('/discounts/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new discount (protected)
app.post('/discounts', authenticateToken, async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_booking_amount, max_discount_amount, usage_limit, valid_from, valid_until } = req.body;
    
    const { data, error } = await supabase
      .from('discounts')
      .insert({
        code,
        description,
        discount_type,
        discount_value,
        min_booking_amount: min_booking_amount || 0,
        max_discount_amount,
        usage_limit,
        used_count: 0,
        valid_from,
        valid_until,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update discount (protected)
app.put('/discounts/:id', authenticateToken, async (req, res) => {
  try {
    const { description, discount_type, discount_value, min_booking_amount, max_discount_amount, usage_limit, valid_from, valid_until, is_active } = req.body;
    
    const { data, error } = await supabase
      .from('discounts')
      .update({
        description,
        discount_type,
        discount_value,
        min_booking_amount,
        max_discount_amount,
        usage_limit,
        valid_from,
        valid_until,
        is_active,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE discount (protected)
app.delete('/discounts/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Discount deleted successfully' });
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
