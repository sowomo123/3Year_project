import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { token, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🎬 Druk Cinema
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/movies">Movies</Link>
          <Link to="/cinemas">Cinemas</Link>
          {token ? (
            <>
              <Link to="/my-tickets">My Tickets</Link>
              <button onClick={logout} className="nav-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="nav-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
