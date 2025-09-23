import { useLocation, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const BookingConfirmation = () => {
  const location = useLocation();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking);
    }
  }, [location.state]);

  // Redirect if no booking data
  if (!booking) {
    return <Navigate to="/movies" replace />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle seats data - it could be array or JSON string
  const seatsArray = Array.isArray(booking.seats) 
    ? booking.seats 
    : (typeof booking.seats === 'string' ? JSON.parse(booking.seats || '[]') : []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-600">Your seats have been successfully reserved</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Booking Details</h2>
            <p className="text-slate-600 text-sm">Booking ID: #{booking.id}</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Movie & Show Info */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Show Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Movie</p>
                  <p className="font-medium text-slate-900">{booking.show?.movie?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Duration</p>
                  <p className="font-medium text-slate-900">{booking.show?.movie?.durationMin} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Cinema</p>
                  <p className="font-medium text-slate-900">{booking.show?.screen?.cinema?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Screen</p>
                  <p className="font-medium text-slate-900">{booking.show?.screen?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Date</p>
                  <p className="font-medium text-slate-900">{formatDate(booking.show?.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Time</p>
                  <p className="font-medium text-slate-900">{formatTime(booking.show?.startTime)}</p>
                </div>
              </div>
            </div>

            {/* Seats */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Selected Seats</h3>
              <div className="flex flex-wrap gap-2">
                {seatsArray.map((seatId) => (
                  <span
                    key={seatId}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {seatId}
                  </span>
                ))}
              </div>
              <p className="text-slate-600 text-sm mt-2">
                {seatsArray.length} seat{seatsArray.length > 1 ? 's' : ''} booked
              </p>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Seat Price (₹{booking.show?.price} × {JSON.parse(booking.seats).length})</span>
                  <span className="text-slate-900">₹{(booking.show?.price * JSON.parse(booking.seats).length).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Amount</span>
                  <span className="text-slate-900">₹{booking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-600 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-green-900">Payment Confirmed</p>
                  <p className="text-green-700 text-sm">Your booking is confirmed and seats are reserved</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/bookings/history"
            className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors text-center font-medium"
          >
            View All Bookings
          </Link>
          <Link
            to="/movies"
            className="bg-slate-100 text-slate-800 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors text-center font-medium"
          >
            Book Another Movie
          </Link>
        </div>

        {/* Important Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-amber-900 mb-1">Important</p>
              <p className="text-amber-800 text-sm">
                Please arrive at the cinema 15 minutes before the show time. 
                Carry a valid ID for verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;