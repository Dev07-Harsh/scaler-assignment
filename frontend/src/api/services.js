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

// Admin API calls
export const adminAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getAllBookings: () => apiClient.get('/admin/bookings'),
  getShowSeats: (showId) => apiClient.get(`/admin/shows/${showId}/seats`),
  
  // Cinemas CRUD
  createCinema: (cinemaData) => apiClient.post('/cinemas', cinemaData),
  updateCinema: (id, cinemaData) => apiClient.put(`/cinemas/${id}`, cinemaData),
  deleteCinema: (id) => apiClient.delete(`/cinemas/${id}`),
  
  // Movies CRUD
  createMovie: (movieData) => apiClient.post('/movies', movieData),
  updateMovie: (id, movieData) => apiClient.put(`/movies/${id}`, movieData),
  deleteMovie: (id) => apiClient.delete(`/movies/${id}`),
  
  // Screens CRUD
  getScreens: (params = {}) => apiClient.get('/screens', { params }),
  getScreenById: (id) => apiClient.get(`/screens/${id}`),
  createScreen: (screenData) => apiClient.post('/screens', screenData),
  updateScreen: (id, screenData) => apiClient.put(`/screens/${id}`, screenData),
  deleteScreen: (id) => apiClient.delete(`/screens/${id}`),
  
  // Shows CRUD
  createShow: (showData) => apiClient.post('/shows', showData),
  updateShow: (id, showData) => apiClient.put(`/shows/${id}`, showData),
  deleteShow: (id) => apiClient.delete(`/shows/${id}`),
};