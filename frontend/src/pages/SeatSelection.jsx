import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../api/services';
import { useBookingStore } from '../store/bookingStore';
import socketService from '../services/socketService';

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { selectedSeats, selectSeat, deselectSeat, clearSelectedSeats } = useBookingStore();
  
  const [seatMap, setSeatMap] = useState({});
  const [bookedSeats, setBookedSeats] = useState([]);
  const [blockedSeats, setBlockedSeats] = useState({}); // { seatId: { userId, expiresAt } }
  const [showDetails, setShowDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Socket event handlers
  const handleSocketConnected = useCallback(() => {
    setSocketConnected(true);
    socketService.joinShow(parseInt(showId));
  }, [showId]);

  const handleSocketDisconnected = useCallback(() => {
    setSocketConnected(false);
  }, []);

  const handleSeatsBlocked = useCallback((data) => {
    console.log('Received seats-blocked event:', data);
    console.log('Current showId:', showId, 'Event showId:', data.showId);
    if (data.showId !== parseInt(showId)) {
      console.log('ShowId mismatch, ignoring event');
      return;
    }
    
    setBlockedSeats(prev => {
      const newBlocked = { ...prev };
      data.seats.forEach(seat => {
        newBlocked[seat] = {
          userId: data.userId,
          expiresAt: data.expiresAt
        };
      });
      console.log('Updated blocked seats:', newBlocked);
      return newBlocked;
    });
  }, [showId]);

  const handleSeatsUnblocked = useCallback((data) => {
    console.log('Received seats-unblocked event:', data);
    console.log('Current showId:', showId, 'Event showId:', data.showId);
    if (data.showId !== parseInt(showId)) {
      console.log('ShowId mismatch, ignoring event');
      return;
    }
    
    setBlockedSeats(prev => {
      const newBlocked = { ...prev };
      data.seats.forEach(seat => {
        delete newBlocked[seat];
      });
      console.log('Updated blocked seats after unblock:', newBlocked);
      return newBlocked;
    });
  }, [showId]);

  const handleBookingConfirmed = useCallback((data) => {
    if (data.showId !== parseInt(showId)) return;
    
    // Move seats from blocked to permanently booked
    setBookedSeats(prev => [...prev, ...data.seats]);
    setBlockedSeats(prev => {
      const newBlocked = { ...prev };
      data.seats.forEach(seat => {
        delete newBlocked[seat];
      });
      return newBlocked;
    });
  }, [showId]);

  const handleBookingCancelled = useCallback((data) => {
    if (data.showId !== parseInt(showId)) return;
    
    // Remove seats from booked list
    setBookedSeats(prev => prev.filter(seat => !data.seats.includes(seat)));
  }, [showId]);

  useEffect(() => {
    fetchSeatLayout();
    clearSelectedSeats();

    // Setup socket event listeners
    socketService.on('connected', handleSocketConnected);
    socketService.on('disconnected', handleSocketDisconnected);
    socketService.on('seats-blocked', handleSeatsBlocked);
    socketService.on('seats-unblocked', handleSeatsUnblocked);
    socketService.on('booking-confirmed', handleBookingConfirmed);
    socketService.on('booking-cancelled', handleBookingCancelled);

    // Join show if socket is already connected
    if (socketService.isSocketConnected()) {
      handleSocketConnected();
    }

    return () => {
      // Cleanup: unblock user's seats and leave show
      if (selectedSeats.length > 0) {
        socketService.unblockSeats(parseInt(showId), selectedSeats).catch(console.error);
      }
      socketService.leaveShow(parseInt(showId));
      
      // Remove event listeners
      socketService.off('connected', handleSocketConnected);
      socketService.off('disconnected', handleSocketDisconnected);
      socketService.off('seats-blocked', handleSeatsBlocked);
      socketService.off('seats-unblocked', handleSeatsUnblocked);
      socketService.off('booking-confirmed', handleBookingConfirmed);
      socketService.off('booking-cancelled', handleBookingCancelled);
    };
  }, [showId]);

  // Auto-block selected seats when they change
  useEffect(() => {
    if (!socketConnected || selectedSeats.length === 0) return;

    const blockSelectedSeats = async () => {
      try {
        await socketService.blockSeats(parseInt(showId), selectedSeats);
      } catch (error) {
        console.error('Failed to block seats:', error);
      }
    };

    blockSelectedSeats();
  }, [selectedSeats, socketConnected, showId]);

  const fetchSeatLayout = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getSeats(showId);
      setSeatMap(response.data.seatMap || {});
      setBookedSeats(response.data.bookedSeats || []);
      setShowDetails(response.data.show || null);
    } catch (err) {
      setError('Failed to load seat layout. Please try again.');
      console.error('Error fetching seats:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSeatGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatGrid = [];
    
    for (let row of rows) {
      const rowSeats = [];
      for (let seatNum = 1; seatNum <= 10; seatNum++) {
        const seatId = `${row}${seatNum}`;
        const isBooked = bookedSeats.includes(seatId);
        const isBlocked = blockedSeats[seatId] && !selectedSeats.includes(seatId);
        rowSeats.push({ 
          id: seatId, 
          isBooked, 
          isBlocked,
          blockedBy: blockedSeats[seatId]?.userId
        });
      }
      seatGrid.push({ row, seats: rowSeats });
    }
    
    return seatGrid;
  };

  const handleSeatClick = async (seatId, isBooked, isBlocked) => {
    if (isBooked || isBlocked) return;
    
    const isSelected = selectedSeats.includes(seatId);
    
    if (isSelected) {
      deselectSeat(seatId);
      // Unblock the seat
      try {
        await socketService.unblockSeats(parseInt(showId), [seatId]);
      } catch (error) {
        console.error('Failed to unblock seat:', error);
      }
    } else {
      if (selectedSeats.length >= 6) {
        setError('Maximum 6 seats can be selected');
        setTimeout(() => setError(null), 3000);
        return;
      }
      selectSeat(seatId);
    }
  };

  const getSeatStyle = (seatId, isBooked, isBlocked) => {
    const baseStyle = 'w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-all duration-200 border-2';
    
    if (isBooked) {
      return `${baseStyle} bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed`;
    }
    
    if (isBlocked) {
      return `${baseStyle} bg-amber-200 text-amber-800 border-amber-300 cursor-not-allowed animate-pulse`;
    }
    
    if (selectedSeats.includes(seatId)) {
      return `${baseStyle} bg-slate-700 text-white border-slate-700 hover:bg-slate-800 cursor-pointer shadow-md`;
    }
    
    return `${baseStyle} bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer`;
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setBooking(true);
      const bookingData = {
        showId: parseInt(showId),
        seats: selectedSeats
      };
      
      const response = await bookingAPI.createBooking(bookingData);
      
      if (response.data.success) {
        navigate('/bookings/confirmation', { 
          state: { booking: response.data }
        });
      }
    } catch (err) {
      let errorMessage = 'Booking failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('Error creating booking:', err);
      
      // Refresh seat layout to get updated availability
      fetchSeatLayout();
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-600">Loading seat layout...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showDetails) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchSeatLayout}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const seatGrid = generateSeatGrid();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Show Details */}
        {showDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {showDetails.movie?.title}
                </h1>
                <div className="text-slate-600 space-y-1">
                  <p>{showDetails.screen?.cinema?.name} - {showDetails.screen?.name}</p>
                  <p>{new Date(showDetails.startTime).toLocaleDateString()} at {new Date(showDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">₹{showDetails.price}</p>
                  <p className="text-slate-600">per seat</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600">
              {socketConnected ? 'Real-time updates active' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Seat Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Your Seats</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-slate-200 rounded"></div>
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-700 rounded"></div>
              <span className="text-slate-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-200 border-2 border-amber-300 rounded animate-pulse"></div>
              <span className="text-slate-600">Blocked by others</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-300 rounded"></div>
              <span className="text-slate-600">Booked</span>
            </div>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          {/* Screen */}
          <div className="text-center mb-8">
            <div className="bg-slate-100 text-slate-600 py-3 px-8 rounded-lg inline-block text-sm font-medium">
              SCREEN
            </div>
          </div>

          {/* Seat Grid */}
          <div className="max-w-2xl mx-auto">
            {seatGrid.map((rowData) => (
              <div key={rowData.row} className="flex items-center justify-center gap-2 mb-2">
                {/* Row Label */}
                <div className="w-6 text-center text-slate-600 font-medium text-sm">
                  {rowData.row}
                </div>
                
                {/* Seats */}
                <div className="flex gap-1">
                  {rowData.seats.slice(0, 5).map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id, seat.isBooked, seat.isBlocked)}
                      disabled={seat.isBooked || seat.isBlocked || booking}
                      className={getSeatStyle(seat.id, seat.isBooked, seat.isBlocked)}
                      title={seat.isBlocked ? 'Seat blocked by another user' : seat.isBooked ? 'Seat already booked' : `Select seat ${seat.id}`}
                    >
                      {seat.id.slice(-1)}
                    </button>
                  ))}
                </div>
                
                {/* Aisle */}
                <div className="w-4"></div>
                
                {/* Seats */}
                <div className="flex gap-1">
                  {rowData.seats.slice(5, 10).map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id, seat.isBooked, seat.isBlocked)}
                      disabled={seat.isBooked || seat.isBlocked || booking}
                      className={getSeatStyle(seat.id, seat.isBooked, seat.isBlocked)}
                      title={seat.isBlocked ? 'Seat blocked by another user' : seat.isBooked ? 'Seat already booked' : `Select seat ${seat.id}`}
                    >
                      {seat.id.slice(-1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seats & Booking */}
        {selectedSeats.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Selected Seats</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSeats.map((seatId) => (
                    <span
                      key={seatId}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {seatId}
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 text-sm">
                  {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected (max 6)
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 text-right">
                <div className="mb-4">
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{(selectedSeats.length * (showDetails?.price || 0)).toLocaleString()}
                  </p>
                  <p className="text-slate-600 text-sm">Total Amount</p>
                </div>
                
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="bg-slate-800 text-white px-8 py-3 rounded-lg hover:bg-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? 'Booking...' : 'Book Seats'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatSelection;