const API_BASE_URL = 'http://localhost:4000';

export const api = {
  auth: {
    register: (data) => fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    login: (data) => fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    verify: (token) => fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),
  },
  movies: {
    getAll: () => fetch(`${API_BASE_URL}/movie/movies`),
    getById: (id) => fetch(`${API_BASE_URL}/movie/movies/${id}`),
  },
  cinemas: {
    getAll: () => fetch(`${API_BASE_URL}/cinema/cinemas`),
    getById: (id) => fetch(`${API_BASE_URL}/cinema/cinemas/${id}`),
  },
  showtimes: {
    getAll: (params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetch(`${API_BASE_URL}/showtime/showtimes?${queryString}`);
    },
    getById: (id) => fetch(`${API_BASE_URL}/showtime/showtimes/${id}`),
  },
  bookings: {
    getAll: (token) => fetch(`${API_BASE_URL}/booking/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    getById: (id, token) => fetch(`${API_BASE_URL}/booking/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    create: (data, token) => fetch(`${API_BASE_URL}/booking/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),
  },
  tickets: {
    getAll: (token) => fetch(`${API_BASE_URL}/ticket/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    getByQR: (qrCode) => fetch(`${API_BASE_URL}/ticket/tickets/qr/${qrCode}`),
  },
};

export default API_BASE_URL;
