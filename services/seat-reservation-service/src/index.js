require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'seat-reservation-service';
const PORT = process.env.PORT || 4008;
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

// GET all seat reservations
app.get('/seat-reservations', async (req, res) => {
  try {
    const { booking_id, showtime_id, seat_id, reservation_status } = req.query;
    let query = supabase.from('seat_reservations').select('*, bookings(*), showtimes(*), seats(*)');
    
    if (booking_id) query = query.eq('booking_id', booking_id);
    if (showtime_id) query = query.eq('showtime_id', showtime_id);
    if (seat_id) query = query.eq('seat_id', seat_id);
    if (reservation_status) query = query.eq('reservation_status', reservation_status);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single seat reservation by ID
app.get('/seat-reservations/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('seat_reservations')
      .select('*, bookings(*), showtimes(*), seats(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Seat reservation not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET available seats for a showtime
app.get('/seat-reservations/showtime/:showtime_id/available', async (req, res) => {
  try {
    const { data: reservedSeats, error } = await supabase
      .from('seat_reservations')
      .select('seat_id')
      .eq('showtime_id', req.params.showtime_id)
      .neq('reservation_status', 'cancelled');
    
    if (error) throw error;
    
    const reservedSeatIds = reservedSeats.map(r => r.seat_id);
    
    const { data: allSeats } = await supabase
      .from('seats')
      .select('*')
      .eq('hall_id', (await supabase.from('showtimes').select('hall_id').eq('id', req.params.showtime_id).single()).data?.hall_id);
    
    const availableSeats = allSeats.filter(seat => !reservedSeatIds.includes(seat.id));
    res.json(availableSeats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create seat reservation (protected)
app.post('/seat-reservations', authenticateToken, async (req, res) => {
  try {
    const { booking_id, seat_id, showtime_id, price } = req.body;
    
    const { data, error } = await supabase
      .from('seat_reservations')
      .insert({
        booking_id,
        seat_id,
        showtime_id,
        price,
        reservation_status: 'reserved',
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update seat reservation status (protected)
app.put('/seat-reservations/:id', authenticateToken, async (req, res) => {
  try {
    const { reservation_status } = req.body;
    
    const { data, error } = await supabase
      .from('seat_reservations')
      .update({ reservation_status })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Seat reservation not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE seat reservation (protected)
app.delete('/seat-reservations/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('seat_reservations')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Seat reservation deleted successfully' });
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
