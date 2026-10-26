import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

const MyTickets = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.tickets.getAll(token);
        const data = await res.json();
        setTickets(data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };
    fetchTickets();
  }, [token]);

  return (
    <div className="my-tickets-page">
      <h1>My Tickets</h1>
      {tickets.length === 0 ? (
        <p>No tickets yet. Book your first movie!</p>
      ) : (
        <div className="tickets-grid">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card">
              <h2>{ticket.showtimes?.movies?.title}</h2>
              <p>🎬 {ticket.showtimes?.cinemas?.name}</p>
              <p>🏛️ {ticket.showtimes?.halls?.name}</p>
              <p>📅 {new Date(ticket.showtimes?.show_date).toLocaleDateString()}</p>
              <p>⏰ {ticket.showtimes?.start_time}</p>
              <p>💺 Seat: R{ticket.seats?.row_number}S{ticket.seats?.seat_number}</p>
              <p>🎫 Ticket #: {ticket.ticket_number}</p>
              <p className={ticket.is_scanned ? 'scanned' : 'not-scanned'}>
                {ticket.is_scanned ? '✅ Scanned' : '⏳ Not Scanned'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
