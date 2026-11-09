import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';

const Cinemas = () => {
  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await api.cinemas.getAll();
        const data = await res.json();
        setCinemas(data);
      } catch (error) {
        console.error('Error fetching cinemas:', error);
      }
    };
    fetchCinemas();
  }, []);

  return (
    <div className="cinemas-page">
      <div className="page-header">
        <h1>Our Cinemas</h1>
      </div>
      <div className="cinema-grid">
        {cinemas.map(cinema => (
          <Link key={cinema.id} to="/cinemas" className="cinema-card">
            <h3>{cinema.name}</h3>
            <p>📍 {cinema.location}, {cinema.city}</p>
            <p>📞 {cinema.phone}</p>
            <p>🎬 {cinema.total_halls} Halls</p>
            <div className="cinema-facilities">
              <span className="facility-tag">Dolby Atmos</span>
              <span className="facility-tag">4K Projection</span>
              <span className="facility-tag">Premium Seating</span>
            </div>
            <p className={cinema.is_active ? 'status active' : 'status inactive'}>
              {cinema.is_active ? '✓ Open Now' : '✕ Temporarily Closed'}
            </p>
            <span className="cinema-action-btn">View Showtimes</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Cinemas;
