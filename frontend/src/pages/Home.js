import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const moviesRes = await api.movies.getAll();
        const moviesData = await moviesRes.json();
        setMovies(moviesData.slice(0, 6));

        const cinemasRes = await api.cinemas.getAll();
        const cinemasData = await cinemasRes.json();
        setCinemas(cinemasData.slice(0, 4));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Experience the Magic of Cinema</h1>
          <p>Discover movies, choose your favourite seats, and book your tickets effortlessly at Bhutan's premier cinema chain.</p>
          <div className="hero-buttons">
            <Link to="/movies" className="cta-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Explore Movies
            </Link>
            <Link to="/cinemas" className="cta-btn secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Find Cinemas
            </Link>
          </div>
        </div>
      </section>

      <section className="section-container">
        <div className="section-header">
          <h2>Featured Movies</h2>
          <p>Discover the latest blockbusters and timeless classics now showing</p>
        </div>
        <div className="movie-grid">
          {movies.map(movie => (
            <Link key={movie.id} to={`/movies/${movie.id}`} className="movie-card">
              <div className="movie-poster-wrapper">
                <img src={movie.poster_url || '/placeholder.jpg'} alt={movie.title} />
                <div className="movie-overlay">
                  <span className="rating">⭐ {movie.rating}</span>
                </div>
              </div>
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <div className="movie-meta">
                  <span className="movie-tag">{movie.genre}</span>
                  <span className="movie-tag">{movie.duration} min</span>
                </div>
                <div className="movie-card-actions">
                  <span className="movie-action-btn secondary">View Details</span>
                  <span className="movie-action-btn primary">Book Tickets</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container">
        <div className="section-header">
          <h2>Our Cinemas</h2>
          <p>State-of-the-art cinemas across Bhutan for the ultimate movie experience</p>
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
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Druk Cinema?</h2>
          <p>Experience cinema like never before with our premium features</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎫</div>
            <h3>Easy Online Booking</h3>
            <p>Book your tickets in seconds with our seamless online booking system</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💺</div>
            <h3>Interactive Seat Selection</h3>
            <p>Choose your perfect seats with our interactive 3D seat selection</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Payments</h3>
            <p>Safe and secure payment processing with multiple payment options</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Instant E-Tickets</h3>
            <p>Receive your e-tickets instantly via email and SMS</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📷</div>
            <h3>QR Code Verification</h3>
            <p>Quick and secure QR code ticket verification at the cinema</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Book your movie tickets in four simple steps</p>
        </div>
        <div className="steps-container">
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Browse Movies</h3>
              <p>Explore our collection of movies</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Select Cinema & Showtime</h3>
              <p>Choose your preferred cinema and time</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Choose Your Seats</h3>
              <p>Pick your favorite seats interactively</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Get E-Ticket</h3>
              <p>Receive your ticket instantly</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
