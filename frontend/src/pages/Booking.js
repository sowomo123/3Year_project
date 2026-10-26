import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

const Booking = () => {
  const { showtimeId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const showtimeRes = await api.showtimes.getById(showtimeId);
        const showtimeData = await showtimeRes.json();
        setShowtime(showtimeData);

        const seatsRes = await fetch(`http://localhost:4000/seat/seats?hall_id=${showtimeData.hall_id}`);
        const seatsData = await seatsRes.json();
        setSeats(seatsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [showtimeId]);

  const toggleSeat = (seatId) => {
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    try {
      const res = await api.bookings.create(
        { showtime_id: showtimeId, seat_ids: selectedSeats, discount_code: discountCode },
        token
      );
      const data = await res.json();
      
      if (res.ok) {
        alert('Booking successful!');
        navigate('/my-tickets');
      } else {
        alert(data.error || 'Booking failed');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  if (!showtime) return <div>Loading...</div>;

  const totalAmount = selectedSeats.length * showtime.base_price;

  return (
    <div className="booking-page">
      <h1>Book Tickets</h1>
      <div className="booking-info">
        <h2>{showtime.movies?.title}</h2>
        <p>{showtime.cinemas?.name} - {showtime.halls?.name}</p>
        <p>{new Date(showtime.show_date).toLocaleDateString()} at {showtime.start_time}</p>
        <p>Price: Nu. {showtime.base_price} per seat</p>
      </div>

      <div className="seat-selection">
        <h3>Select Seats</h3>
        <div className="seats-grid">
          {seats.map(seat => (
            <button
              key={seat.id}
              className={`seat ${selectedSeats.includes(seat.id) ? 'selected' : ''} ${!seat.is_active ? 'unavailable' : ''}`}
              onClick={() => seat.is_active && toggleSeat(seat.id)}
              disabled={!seat.is_active}
            >
              R{seat.row_number}S{seat.seat_number}
            </button>
          ))}
        </div>
      </div>

      <div className="booking-summary">
        <h3>Summary</h3>
        <p>Selected Seats: {selectedSeats.length}</p>
        <p>Total Amount: Nu. {totalAmount}</p>
        <input
          type="text"
          placeholder="Discount Code (optional)"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="discount-input"
        />
        <button onClick={handleBooking} className="book-btn">Confirm Booking</button>
      </div>
    </div>
  );
};

export default Booking;
