import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await api.movies.getAll();
        const data = await res.json();
        setMovies(data);
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    };
    fetchMovies();
  }, []);

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(filter.toLowerCase()) ||
    movie.genre.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="movies-page">
      <div className="page-header">
        <h1>All Movies</h1>
        <input
          type="text"
          placeholder="Search movies by title or genre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="movie-grid">
        {filteredMovies.map(movie => (
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
                <span className="movie-tag">{movie.language}</span>
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
    </div>
  );
};

export default Movies;
