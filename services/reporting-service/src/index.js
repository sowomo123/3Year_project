require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'reporting-service';
const PORT = process.env.PORT || 4018;
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

// GET revenue report
app.get('/reports/revenue', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = supabase
      .from('bookings')
      .select('created_at, final_amount, payment_status, showtimes(*, movies(*), cinemas(*))')
      .eq('payment_status', 'paid');
    
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    
    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) throw error;
    
    const totalRevenue = data.reduce((sum, b) => sum + (b.final_amount || 0), 0);
    
    res.json({
      totalRevenue,
      transactions: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET booking report
app.get('/reports/bookings', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, cinema_id } = req.query;
    let query = supabase
      .from('bookings')
      .select('*, showtimes(*, movies(*), cinemas(*)), users(*)');
    
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    if (cinema_id) query = query.eq('showtimes.cinema_id', cinema_id);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({
      total: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET movie popularity report
app.get('/reports/movie-popularity', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('showtimes!inner(movies(title)), count')
      .eq('payment_status', 'paid');
    
    if (error) throw error;
    res.json(data);
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
