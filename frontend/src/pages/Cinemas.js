import React, { useEffect, useState } from 'react';
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
      <h1>Our Cinemas</h1>
      <div className="cinema-grid">
        {cinemas.map(cinema => (
          <div key={cinema.id} className="cinema-card">
            <h3>{cinema.name}</h3>
            <p>📍 {cinema.location}, {cinema.city}</p>
            <p>📞 {cinema.phone}</p>
            <p>🎬 {cinema.total_halls} Halls</p>
            <p className={cinema.is_active ? 'status active' : 'status inactive'}>
              {cinema.is_active ? 'Open' : 'Closed'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cinemas;
