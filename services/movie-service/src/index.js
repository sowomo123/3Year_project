require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'template-service';
const PORT = process.env.PORT || 4000;

// Health check: tells us the service is alive
app.get('/health', (req, res) => {
  res.json({ service: SERVICE_NAME, status: 'ok' });
});

app.get('/movies', async (req, res) => {
  const { data, error } = await supabase.from('movies').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Error handler: catches mistakes so the service doesn't crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
