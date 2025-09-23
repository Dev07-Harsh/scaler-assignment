/**
 * Parse seat string like "A1" to row/col numbers
 * @param {string} seatString - Seat identifier like "A1", "J10"
 * @returns {Object} - { row: number, col: number, label: string } or null if invalid
 */
const parseSeatString = (seatString) => {
  if (!seatString || typeof seatString !== 'string') {
    return null;
  }

  const trimmed = seatString.trim().toUpperCase();
  
  // Must be 2-3 characters: letter + 1-2 digits
  if (trimmed.length < 2 || trimmed.length > 3) {
    return null;
  }

  const rowLetter = trimmed[0];
  const colString = trimmed.slice(1);

  // Validate row letter (A-J)
  if (rowLetter < 'A' || rowLetter > 'J') {
    return null;
  }

  // Validate column number (1-10)
  const col = parseInt(colString, 10);
  if (isNaN(col) || col < 1 || col > 10) {
    return null;
  }

  const row = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0) + 1; // A=1, B=2, ..., J=10

  return {
    row,
    col,
    label: `${rowLetter}${col}`
  };
};

/**
 * Check if seat string is valid
 * @param {string} seatString - Seat identifier
 * @returns {boolean}
 */
const isValidSeatString = (seatString) => {
  return parseSeatString(seatString) !== null;
};

/**
 * Convert seat labels to database format
 * @param {string[]} seatLabels - Array of seat strings like ["A1", "A2"]
 * @returns {Object[]} - Array of { row: number, col: number }
 */
const seatsToDbFormat = (seatLabels) => {
  if (!Array.isArray(seatLabels)) {
    return [];
  }

  return seatLabels.map(seatLabel => {
    const parsed = parseSeatString(seatLabel);
    if (!parsed) {
      throw new Error(`Invalid seat format: ${seatLabel}`);
    }
    return {
      row: parsed.row,
      col: parsed.col
    };
  });
};

/**
 * Convert database seat format back to labels
 * @param {Object[]|string[]} dbSeats - Database seats format
 * @returns {string[]} - Array of seat labels like ["A1", "A2"]
 */
const dbSeatsToLabels = (dbSeats) => {
  if (!Array.isArray(dbSeats)) {
    return [];
  }

  return dbSeats.map(seat => {
    // Handle both object format { row: 1, col: 1 } and string format "A1"
    if (typeof seat === 'string') {
      return seat.toUpperCase();
    }
    
    if (seat && typeof seat === 'object' && seat.row && seat.col) {
      const rowLetter = String.fromCharCode('A'.charCodeAt(0) + seat.row - 1);
      return `${rowLetter}${seat.col}`;
    }
    
    throw new Error(`Invalid database seat format: ${JSON.stringify(seat)}`);
  });
};

/**
 * Find conflicts between requested seats and already booked seats
 * @param {string[]} requestedSeats - Array of requested seat labels
 * @param {string[]} bookedSeats - Array of already booked seat labels
 * @returns {string[]} - Array of conflicting seat labels
 */
const findConflicts = (requestedSeats, bookedSeats) => {
  if (!Array.isArray(requestedSeats) || !Array.isArray(bookedSeats)) {
    return [];
  }

  const bookedSet = new Set(bookedSeats.map(seat => seat.toUpperCase()));
  
  return requestedSeats.filter(seat => 
    bookedSet.has(seat.toUpperCase())
  );
};

/**
 * Validate array of seat strings
 * @param {string[]} seats - Array of seat strings
 * @returns {Object} - { valid: boolean, invalidSeats: string[], message: string }
 */
const validateSeats = (seats) => {
  if (!Array.isArray(seats)) {
    return {
      valid: false,
      invalidSeats: [],
      message: 'Seats must be an array'
    };
  }

  if (seats.length === 0) {
    return {
      valid: false,
      invalidSeats: [],
      message: 'At least one seat must be selected'
    };
  }

  if (seats.length > 6) {
    return {
      valid: false,
      invalidSeats: [],
      message: 'Maximum 6 seats can be booked at once'
    };
  }

  const invalidSeats = seats.filter(seat => !isValidSeatString(seat));
  
  if (invalidSeats.length > 0) {
    return {
      valid: false,
      invalidSeats,
      message: `Invalid seat format: ${invalidSeats.join(', ')}. Use format like A1, B2, J10`
    };
  }

  // Check for duplicates
  const uniqueSeats = [...new Set(seats.map(s => s.toUpperCase()))];
  if (uniqueSeats.length !== seats.length) {
    return {
      valid: false,
      invalidSeats: [],
      message: 'Duplicate seats are not allowed'
    };
  }

  return {
    valid: true,
    invalidSeats: [],
    message: 'All seats are valid'
  };
};

module.exports = {
  parseSeatString,
  isValidSeatString,
  seatsToDbFormat,
  dbSeatsToLabels,
  findConflicts,
  validateSeats
};