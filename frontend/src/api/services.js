import apiClient from './index.js';

// Auth API calls
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  signup: (userData) => apiClient.post('/auth/signup', userData),
  getProfile: () => apiClient.get('/profile'),
};

// Movies API calls
export const moviesAPI = {
  getMovies: (params = {}) => apiClient.get('/movies', { params }),
  getMovieById: (id) => apiClient.get(`/movies/${id}`),
};

// Cinemas API calls
export const cinemasAPI = {
  getCinemas: (params = {}) => apiClient.get('/cinemas', { params }),
  getCinemaById: (id) => apiClient.get(`/cinemas/${id}`),
};

// Shows API calls
export const showsAPI = {
  getShows: (params = {}) => apiClient.get('/shows', { params }),
  getShowById: (id) => apiClient.get(`/shows/${id}`),
};

// Bookings API calls
export const bookingAPI = {
  createBooking: (bookingData) => apiClient.post('/bookings', bookingData),
  getBookingHistory: () => apiClient.get('/bookings/history'),
  getSeats: (showId) => apiClient.get(`/bookings/seats/${showId}`),
  cancelBooking: (bookingId) => apiClient.post(`/bookings/cancel/${bookingId}`),
};

// Legacy alias for backward compatibility
export const bookingsAPI = {
  createBooking: (bookingData) => apiClient.post('/bookings', bookingData),
  getBookingHistory: () => apiClient.get('/bookings/history'),
  getSeatAvailability: (showId) => apiClient.get(`/bookings/seats/${showId}`),
};