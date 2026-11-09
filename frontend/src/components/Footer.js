import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Druk Cinema</h3>
            <p>Bhutan's premier cinema experience. Bringing the magic of cinema closer to Bhutan with state-of-the-art theaters and premium movie experiences.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/movies">Movies</a></li>
              <li><a href="/cinemas">Cinemas</a></li>
              <li><a href="/my-tickets">My Bookings</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Cinema Locations</h4>
            <ul>
              <li><a href="/cinemas">Thimphu</a></li>
              <li><a href="/cinemas">Paro</a></li>
              <li><a href="/cinemas">Punakha</a></li>
              <li><a href="/cinemas">Wangdue</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <ul>
              <li>📍 Thimphu, Bhutan</li>
              <li>📞 +975 2 322 322</li>
              <li>✉️ info@drukcinema.bt</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Druk Cinema. All rights reserved.</p>
          <p className="footer-tagline">Bringing the magic of cinema closer to Bhutan.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
