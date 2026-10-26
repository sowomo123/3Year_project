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
        <h1>Welcome to Druk Cinema</h1>
        <p>Book movie tickets online in Bhutan</p>
        <Link to="/movies" className="cta-btn">Browse Movies</Link>
      </section>

      <section className="featured-movies">
        <h2>Featured Movies</h2>
        <div className="movie-grid">
          {movies.map(movie => (
            <Link key={movie.id} to={`/movies/${movie.id}`} className="movie-card">
              <img src={movie.poster_url || '/placeholder.jpg'} alt={movie.title} />
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <p>{movie.genre}</p>
                <span className="rating">⭐ {movie.rating}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-cinemas">
        <h2>Our Cinemas</h2>
        <div className="cinema-grid">
          {cinemas.map(cinema => (
            <Link key={cinema.id} to="/cinemas" className="cinema-card">
              <h3>{cinema.name}</h3>
              <p>{cinema.city}</p>
              <p>{cinema.location}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
