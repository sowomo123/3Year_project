require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'ticket-service';
const PORT = process.env.PORT || 4011;
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

// GET all tickets
app.get('/tickets', async (req, res) => {
  try {
    const { user_id, booking_id, is_scanned } = req.query;
    let query = supabase.from('tickets').select('*, bookings(*), showtimes(*, movies(*)), seats(*)');
    
    if (user_id) query = query.eq('user_id', user_id);
    if (booking_id) query = query.eq('booking_id', booking_id);
    if (is_scanned) query = query.eq('is_scanned', is_scanned === 'true');
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ticket by ID
app.get('/tickets/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, bookings(*), showtimes(*, movies(*)), seats(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ticket by QR code
app.get('/tickets/qr/:qr_code', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, bookings(*), showtimes(*, movies(*)), seats(*), users(*)')
      .eq('qr_code', req.params.qr_code)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new tickets from booking (protected)
app.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.body;
    
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, showtimes(*), seat_reservations(*, seats(*))')
      .eq('id', booking_id)
      .single();
    
    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Create tickets for each seat reservation
    const tickets = booking.seat_reservations.map(reservation => {
      const qrCode = crypto.randomBytes(32).toString('hex');
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        booking_id: booking.id,
        user_id: booking.user_id,
        showtime_id: booking.showtime_id,
        seat_id: reservation.seat_id,
        qr_code: qrCode,
        ticket_number: ticketNumber,
      };
    });
    
    const { data, error } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT scan ticket (protected)
app.put('/tickets/:id/scan', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        is_scanned: true,
        scanned_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ticket (protected)
app.delete('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Ticket deleted successfully' });
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
