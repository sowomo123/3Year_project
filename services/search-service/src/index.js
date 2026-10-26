require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'search-service';
const PORT = process.env.PORT || 4015;

// Health check
app.get('/health', (req, res) => {
  res.json({ service: SERVICE_NAME, status: 'ok' });
});

// Search movies
app.get('/search/movies', async (req, res) => {
  try {
    const { q, genre, language, status } = req.query;
    let query = supabase.from('movies').select('*');
    
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (genre) query = query.eq('genre', genre);
    if (language) query = query.eq('language', language);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search cinemas
app.get('/search/cinemas', async (req, res) => {
  try {
    const { q, city } = req.query;
    let query = supabase.from('cinemas').select('*');
    
    if (q) {
      query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
    }
    if (city) query = query.eq('city', city);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search showtimes by movie and date
app.get('/search/showtimes', async (req, res) => {
  try {
    const { movie_id, cinema_id, show_date } = req.query;
    let query = supabase
      .from('showtimes')
      .select('*, movies(*), halls(*), cinemas(*)');
    
    if (movie_id) query = query.eq('movie_id', movie_id);
    if (cinema_id) query = query.eq('cinema_id', cinema_id);
    if (show_date) query = query.eq('show_date', show_date);
    
    const { data, error } = await query.order('show_date', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global search
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const [movies, cinemas] = await Promise.all([
      supabase.from('movies').select('*').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(5),
      supabase.from('cinemas').select('*').or(`name.ilike.%${q}%,location.ilike.%${q}%`).limit(5),
    ]);
    
    res.json({
      movies: movies.data || [],
      cinemas: cinemas.data || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
