require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'booking-service';
const PORT = process.env.PORT || 4019;
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

// GET all bookings
app.get('/bookings', async (req, res) => {
  try {
    const { user_id, showtime_id, booking_status, payment_status } = req.query;
    let query = supabase
      .from('bookings')
      .select('*, showtimes(*, movies(*), halls(*), cinemas(*)), seat_reservations(*, seats(*))');
    
    if (user_id) query = query.eq('user_id', user_id);
    if (showtime_id) query = query.eq('showtime_id', showtime_id);
    if (booking_status) query = query.eq('booking_status', booking_status);
    if (payment_status) query = query.eq('payment_status', payment_status);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single booking by ID
app.get('/bookings/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, showtimes(*, movies(*), halls(*), cinemas(*)), seat_reservations(*, seats(*))')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new booking (protected)
app.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const { showtime_id, seat_ids, discount_code } = req.body;
    
    // Get showtime details
    const { data: showtime, error: showtimeError } = await supabase
      .from('showtimes')
      .select('*, movies(*)')
      .eq('id', showtime_id)
      .single();
    
    if (showtimeError || !showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }
    
    // Get seat details
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .in('id', seat_ids);
    
    if (seatsError || !seats || seats.length === 0) {
      return res.status(404).json({ error: 'Seats not found' });
    }
    
    // Calculate total amount
    let totalAmount = seats.reduce((sum, seat) => {
      return sum + (showtime.base_price * seat.price_multiplier);
    }, 0);
    
    let discountAmount = 0;
    
    // Apply discount if provided
    if (discount_code) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', discount_code)
        .eq('is_active', true)
        .single();
      
      if (discount) {
        if (discount.discount_type === 'percentage') {
          discountAmount = totalAmount * (discount.discount_value / 100);
        } else {
          discountAmount = discount.discount_value;
        }
        if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
          discountAmount = discount.max_discount_amount;
        }
      }
    }
    
    const finalAmount = totalAmount - discountAmount;
    
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user.userId,
        showtime_id,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        booking_status: 'pending',
        payment_status: 'unpaid',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      })
      .select()
      .single();
    
    if (bookingError) throw bookingError;
    
    // Create seat reservations
    const seatReservations = seat_ids.map(seat_id => ({
      booking_id: booking.id,
      seat_id,
      showtime_id,
      price: showtime.base_price,
      reservation_status: 'reserved',
    }));
    
    const { error: reservationError } = await supabase
      .from('seat_reservations')
      .insert(seatReservations);
    
    if (reservationError) throw reservationError;
    
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update booking (protected)
app.put('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { booking_status, payment_status } = req.body;
    
    const { data, error } = await supabase
      .from('bookings')
      .update({
        booking_status,
        payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE booking (protected)
app.delete('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Booking deleted successfully' });
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
