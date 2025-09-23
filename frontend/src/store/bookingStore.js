import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  selectedMovie: null,
  selectedCinema: null,
  selectedShow: null,
  selectedSeats: [],
  bookingStep: 'movies', // movies, cinemas, shows, seats, confirmation
  seatMap: null,
  isLoading: false,
  error: null,

  // Step navigation
  setStep: (step) => set({ bookingStep: step }),
  
  nextStep: () => {
    const { bookingStep } = get();
    const steps = ['movies', 'cinemas', 'shows', 'seats', 'confirmation'];
    const currentIndex = steps.indexOf(bookingStep);
    if (currentIndex < steps.length - 1) {
      set({ bookingStep: steps[currentIndex + 1] });
    }
  },

  previousStep: () => {
    const { bookingStep } = get();
    const steps = ['movies', 'cinemas', 'shows', 'seats', 'confirmation'];
    const currentIndex = steps.indexOf(bookingStep);
    if (currentIndex > 0) {
      set({ bookingStep: steps[currentIndex - 1] });
    }
  },

  // Selection actions
  selectMovie: (movie) => set({ 
    selectedMovie: movie,
    selectedCinema: null,
    selectedShow: null,
    selectedSeats: [],
  }),

  selectCinema: (cinema) => set({ 
    selectedCinema: cinema,
    selectedShow: null,
    selectedSeats: [],
  }),

  selectShow: (show) => set({ 
    selectedShow: show,
    selectedSeats: [],
  }),

  // Seat selection
  toggleSeat: (seat) => {
    const { selectedSeats } = get();
    const seatIndex = selectedSeats.findIndex(s => s === seat);
    
    if (seatIndex >= 0) {
      // Remove seat
      set({
        selectedSeats: selectedSeats.filter(s => s !== seat)
      });
    } else {
      // Add seat (max 6 seats)
      if (selectedSeats.length < 6) {
        set({
          selectedSeats: [...selectedSeats, seat]
        });
      }
    }
  },

  clearSelectedSeats: () => set({ selectedSeats: [] }),

  setSeatMap: (seatMap) => set({ seatMap }),

  // Loading and error states
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Reset booking flow
  resetBooking: () => set({
    selectedMovie: null,
    selectedCinema: null,
    selectedShow: null,
    selectedSeats: [],
    bookingStep: 'movies',
    seatMap: null,
    error: null,
  }),

  // Get booking summary
  getBookingSummary: () => {
    const { selectedMovie, selectedShow, selectedSeats } = get();
    if (!selectedMovie || !selectedShow || selectedSeats.length === 0) {
      return null;
    }

    return {
      movie: selectedMovie.title,
      cinema: selectedShow.screen?.cinema?.name,
      screen: selectedShow.screen?.name,
      showTime: selectedShow.startTime,
      seats: selectedSeats,
      seatCount: selectedSeats.length,
      pricePerSeat: selectedShow.price,
      totalPrice: selectedShow.price * selectedSeats.length,
    };
  },
}));