import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../api/services';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookingHistory();
      setBookings(response.data.data || []);
    } catch (err) {
      setError('Failed to load booking history');
      console.error('Error fetching booking history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingBooking(bookingId);
      await bookingAPI.cancelBooking(bookingId);
      
      // Update the booking status in the local state immediately
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          (booking.id || booking.bookingId) === bookingId 
            ? { ...booking, status: 'CANCELLED' }
            : booking
        )
      );

      // Show success message
      setError(null);
      
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setCancellingBooking(null);
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== 'CONFIRMED') return false;
    
    // Check if show is in the future
    const showTime = new Date(booking.show?.startTime);
    const now = new Date();
    
    return showTime > now;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShowTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <div className="text-red-600 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading History</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchBookingHistory}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Booking History</h1>
          <p className="text-slate-600 mt-1">View all your past movie bookings</p>
        </div>

        {/* Content */}
        {bookings.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-slate-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No bookings yet</h3>
            <p className="text-slate-600 mb-6">You haven't made any movie bookings yet. Start exploring movies to make your first booking!</p>
            <a
              href="/movies"
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
            >
              Browse Movies
            </a>
          </div>
        ) : (
          /* Bookings Table */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Movie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cinema
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Show Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date Booked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {bookings.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {booking.movie.posterUrl && (
                            <div className="flex-shrink-0 h-12 w-8 mr-4">
                              <img
                                className="h-12 w-8 rounded object-cover"
                                src={booking.movie.posterUrl}
                                alt={booking.movie.title}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {booking.movie.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{booking.show.screen.cinema.name}</div>
                        <div className="text-sm text-slate-500">{booking.show.screen.cinema.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatShowTime(booking.show.startTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {booking.seats.map((seat, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatDate(booking.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'CONFIRMED' 
                            ? 'bg-green-100 text-green-800' 
                            : booking.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canCancelBooking(booking) ? (
                          <button
                            onClick={() => handleCancelBooking(booking.id || booking.bookingId)}
                            disabled={cancellingBooking === (booking.id || booking.bookingId)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs font-medium transition-colors"
                          >
                            {cancellingBooking === (booking.id || booking.bookingId) ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-red-700" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Cancelling...
                              </>
                            ) : (
                              'Cancel'
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {booking.status === 'CANCELLED' ? 'Cancelled' : 'Cannot cancel'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;