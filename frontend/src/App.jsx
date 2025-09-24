import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { initializeSocket } from './services/socketService';
import Navbar from './components/Navbar';

// Import pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import Shows from './pages/Shows';
import SeatSelection from './pages/SeatSelection';
import BookingHistory from './pages/BookingHistory';
import BookingConfirmation from './pages/BookingConfirmation';

// Admin imports
import AdminLayout from './admin/components/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import CinemaManager from './admin/pages/CinemaManager';
import MovieManager from './admin/pages/MovieManager';
import ScreenManager from './admin/pages/ScreenManager';
import ShowManager from './admin/pages/ShowManager';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirect to movies if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/movies" replace />;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  return isAuthenticated && user?.role === 'ADMIN' 
    ? children 
    : <Navigate to="/movies" replace />;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    initializeSocket();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Navbar />
        <main>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />

            {/* Protected routes */}
            <Route 
              path="/movies" 
              element={
                <ProtectedRoute>
                  <Movies />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/movies/:movieId/cinemas" 
              element={
                <ProtectedRoute>
                  <MovieDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shows/:showId" 
              element={
                <ProtectedRoute>
                  <Shows />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shows/:showId/seats" 
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings/history" 
              element={
                <ProtectedRoute>
                  <BookingHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings/confirmation" 
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              } 
            >
              <Route index element={<Dashboard />} />
              <Route path="cinemas" element={<CinemaManager />} />
              <Route path="movies" element={<MovieManager />} />
              <Route path="screens" element={<ScreenManager />} />
              <Route path="shows" element={<ShowManager />} />
              <Route path="shows/:showId/seats" element={<SeatSelection />} />
            </Route>

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/movies" replace />} />
            <Route path="*" element={<Navigate to="/movies" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
