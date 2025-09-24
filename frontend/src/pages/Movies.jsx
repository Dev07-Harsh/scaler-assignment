import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { moviesAPI } from '../api/services';
import { useBookingStore } from '../store/bookingStore';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { selectMovie } = useBookingStore();

  useEffect(() => {
    fetchMovies();
  }, [pagination.page]);

  const fetchMovies = async (page = pagination.page) => {
    try {
      setLoading(true);
      const response = await moviesAPI.getMovies({ 
        page, 
        limit: pagination.limit 
      });
      setMovies(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.meta
      }));
    } catch (err) {
      setError('Failed to load movies. Please try again.');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleMovieSelect = (movie) => {
    selectMovie(movie);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-600">Loading movies...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchMovies(pagination.page)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Now Showing</h1>
          <p className="text-sm sm:text-base text-slate-600">Choose a movie to see showtimes</p>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No movies available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 w-full max-w-sm mx-auto sm:max-w-none flex flex-col h-full">
                {/* Fixed aspect ratio container for poster */}
                <div className="aspect-[2/3] bg-slate-100 relative overflow-hidden rounded-t-lg">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-200 hover:scale-[1.02]"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/300x450/1f2937/ffffff?text=${encodeURIComponent(movie.title.substring(0, 20))}`;
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-slate-200 flex items-center justify-center p-3">
                      <div className="text-slate-400 text-xs sm:text-sm font-bold text-center break-words leading-tight">
                        {movie.title}
                      </div>
                    </div>
                  )}
                  
                  {/* Subtle overlay for better visual depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                
                {/* Card content with consistent spacing */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  {/* Movie title with consistent height */}
                  <h3 
                    className="font-semibold text-slate-900 mb-2 text-sm sm:text-base break-words overflow-hidden leading-tight"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.8em',
                      maxHeight: '2.8em'
                    }}
                    title={movie.title}
                  >
                    {movie.title}
                  </h3>
                  
                  {/* Duration with consistent spacing */}
                  <div className="mb-3 h-5 flex items-center">
                    {movie.durationMin && (
                      <p className="text-xs sm:text-sm text-slate-600">
                        {movie.durationMin} min
                      </p>
                    )}
                  </div>
                  
                  {/* Button container - always at bottom */}
                  <div className="mt-auto">
                    <Link
                      to={`/movies/${movie.id}/cinemas`}
                      onClick={() => handleMovieSelect(movie)}
                      className="block w-full bg-slate-800 text-white text-center py-2.5 rounded-lg hover:bg-slate-900 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium"
                    >
                      View Cinemas
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    page === pagination.page
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-slate-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} movies
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;