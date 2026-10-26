require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'admin-service';
const PORT = process.env.PORT || 4017;
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

// GET dashboard stats
app.get('/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalMovies },
      { count: totalCinemas },
      { count: totalBookings },
      { count: totalRevenue },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('movies').select('*', { count: 'exact', head: true }),
      supabase.from('cinemas').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('final_amount', { count: 'exact', head: true }),
    ]);

    const { data: revenueData } = await supabase
      .from('bookings')
      .select('final_amount')
      .eq('payment_status', 'paid');

    const totalRevenueAmount = revenueData?.reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;

    res.json({
      totalUsers,
      totalMovies,
      totalCinemas,
      totalBookings,
      totalRevenue: totalRevenueAmount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users (admin)
app.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, created_at');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all bookings (admin)
app.get('/admin/bookings', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, users(*), showtimes(*, movies(*))')
      .order('created_at', { ascending: false });
    
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
