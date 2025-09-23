import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../api/services';
import { useBookingStore } from '../store/bookingStore';

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { selectedSeats, selectSeat, deselectSeat, clearSelectedSeats } = useBookingStore();
  
  const [seatMap, setSeatMap] = useState({});
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showDetails, setShowDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSeatLayout();
    // Clear previously selected seats when component mounts
    clearSelectedSeats();
  }, [showId]);

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
        rowSeats.push({ id: seatId, isBooked });
      }
      seatGrid.push({ row, seats: rowSeats });
    }
    
    return seatGrid;
  };

  const handleSeatClick = (seatId, isBooked) => {
    if (isBooked) return;
    
    const isSelected = selectedSeats.includes(seatId);
    
    if (isSelected) {
      deselectSeat(seatId);
    } else {
      if (selectedSeats.length >= 6) {
        setError('Maximum 6 seats can be selected');
        setTimeout(() => setError(null), 3000);
        return;
      }
      selectSeat(seatId);
    }
  };

  const getSeatStyle = (seatId, isBooked) => {
    if (isBooked) {
      return 'bg-slate-400 text-slate-600 cursor-not-allowed';
    }
    
    if (selectedSeats.includes(seatId)) {
      return 'bg-blue-600 text-white hover:bg-blue-700';
    }
    
    return 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300';
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
          state: { booking: response.data.booking }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
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

        {/* Seat Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Your Seats</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-slate-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-400 rounded"></div>
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
                      onClick={() => handleSeatClick(seat.id, seat.isBooked)}
                      disabled={seat.isBooked || booking}
                      className={`w-8 h-8 text-xs font-medium rounded transition-colors ${getSeatStyle(seat.id, seat.isBooked)}`}
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
                      onClick={() => handleSeatClick(seat.id, seat.isBooked)}
                      disabled={seat.isBooked || booking}
                      className={`w-8 h-8 text-xs font-medium rounded transition-colors ${getSeatStyle(seat.id, seat.isBooked)}`}
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