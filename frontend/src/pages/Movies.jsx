import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../api/services';
import { useBookingStore } from '../store/bookingStore';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectMovie } = useBookingStore();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getMovies();
      setMovies(response.data.data || []);
    } catch (err) {
      setError('Failed to load movies. Please try again.');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
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
              onClick={fetchMovies}
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Now Showing</h1>
          <p className="text-slate-600">Choose a movie to see showtimes</p>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No movies available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[2/3] bg-slate-100 relative">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                    <div className="text-slate-400 text-4xl font-bold">
                      {movie.title.charAt(0)}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {movie.title}
                  </h3>
                  
                  {movie.durationMin && (
                    <p className="text-sm text-slate-600 mb-3">
                      {movie.durationMin} min
                    </p>
                  )}
                  
                  <Link
                    to={`/movies/${movie.id}/cinemas`}
                    onClick={() => handleMovieSelect(movie)}
                    className="block w-full bg-slate-800 text-white text-center py-2.5 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
                  >
                    View Cinemas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;