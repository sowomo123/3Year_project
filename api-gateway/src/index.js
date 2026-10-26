require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'api-gateway';
const PORT = process.env.PORT || 4000;

// Service routes configuration
const services = {
  '/auth': 'http://localhost:4001',
  '/user-profile': 'http://localhost:4002',
  '/cinema': 'http://localhost:4003',
  '/movie': 'http://localhost:4004',
  '/showtime': 'http://localhost:4005',
  '/hall': 'http://localhost:4006',
  '/seat': 'http://localhost:4007',
  '/seat-reservation': 'http://localhost:4008',
  '/payment': 'http://localhost:4009',
  '/discount': 'http://localhost:4010',
  '/ticket': 'http://localhost:4011',
  '/qr-code': 'http://localhost:4012',
  '/notification': 'http://localhost:4013',
  '/review-rating': 'http://localhost:4014',
  '/search': 'http://localhost:4015',
  '/promotion': 'http://localhost:4016',
  '/admin': 'http://localhost:4017',
  '/reporting': 'http://localhost:4018',
  '/booking': 'http://localhost:4019',
};

// Create proxy middleware for each service
Object.entries(services).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
  }));
});

// Health check: tells us the service is alive
app.get('/health', (req, res) => {
  res.json({ service: SERVICE_NAME, status: 'ok', routes: Object.keys(services) });
});

// Error handler: catches mistakes so the service doesn't crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
  console.log('Routes configured:', Object.keys(services).join(', '));
});
