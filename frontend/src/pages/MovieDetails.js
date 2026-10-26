import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../config/api';

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieRes = await api.movies.getById(id);
        const movieData = await movieRes.json();
        setMovie(movieData);

        const showtimesRes = await api.showtimes.getAll({ movie_id: id });
        const showtimesData = await showtimesRes.json();
        setShowtimes(showtimesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [id]);

  if (!movie) return <div>Loading...</div>;

  return (
    <div className="movie-details">
      <div className="movie-header">
        <img src={movie.poster_url || '/placeholder.jpg'} alt={movie.title} />
        <div className="movie-header-info">
          <h1>{movie.title}</h1>
          <p className="meta">{movie.genre} | {movie.language} | {movie.duration} min</p>
          <p className="rating">⭐ {movie.rating}/10</p>
          <p className="description">{movie.description}</p>
          <p className="release">Release Date: {new Date(movie.release_date).toLocaleDateString()}</p>
        </div>
      </div>

      <section className="showtimes">
        <h2>Showtimes</h2>
        <div className="showtimes-grid">
          {showtimes.map(showtime => (
            <div key={showtime.id} className="showtime-card">
              <h3>{showtime.cinemas?.name}</h3>
              <p>{showtime.halls?.name}</p>
              <p className="date">{new Date(showtime.show_date).toLocaleDateString()}</p>
              <p className="time">{showtime.start_time}</p>
              <p className="price">Nu. {showtime.base_price}</p>
              <Link to={`/booking/${showtime.id}`} className="book-btn">Book Now</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MovieDetails;
