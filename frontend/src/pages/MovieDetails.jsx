import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { moviesAPI } from '../api/services';
import { useBookingStore } from '../store/bookingStore';

const MovieDetails = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectCinema, selectShow } = useBookingStore();

  useEffect(() => {
    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getMovieById(movieId);
      setMovie(response.data.data);
    } catch (err) {
      setError('Failed to load movie details. Please try again.');
      console.error('Error fetching movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatShowTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getShowTimeStatus = (dateTime) => {
    const now = new Date();
    const showTime = new Date(dateTime);
    const timeDiff = showTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff <= 2) {
      return { status: 'soon', label: 'Starting Soon' };
    } else if (hoursDiff <= 24) {
      return { status: 'today', label: 'Today' };
    } else {
      return { status: 'future', label: '' };
    }
  };

  const handleShowSelect = (show) => {
    selectShow(show);
    navigate(`/shows/${show.id}/seats`);
  };

  const filterFutureShows = (shows) => {
    const now = new Date();
    return shows.filter(show => {
      const showTime = new Date(show.startTime);
      return showTime > now;
    });
  };

  const groupShowsByCinema = (shows) => {
    // First filter out past shows
    const futureShows = filterFutureShows(shows);
    
    const grouped = {};
    futureShows.forEach(show => {
      const cinemaKey = `${show.screen.cinema.id}-${show.screen.cinema.name}`;
      if (!grouped[cinemaKey]) {
        grouped[cinemaKey] = {
          cinema: show.screen.cinema,
          shows: []
        };
      }
      grouped[cinemaKey].shows.push(show);
    });
    
    // Sort shows by time within each cinema
    Object.values(grouped).forEach(cinemaGroup => {
      cinemaGroup.shows.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });
    
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-600">Loading movie details...</div>
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
            <div className="space-x-4">
              <button
                onClick={fetchMovieDetails}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/movies"
                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Back to Movies
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">Movie not found.</p>
            <Link
              to="/movies"
              className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Back to Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cinemaGroups = groupShowsByCinema(movie.shows || []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/movies"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Movies
          </Link>
        </div>

        {/* Movie Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-48 aspect-[2/3] bg-slate-100 rounded-lg overflow-hidden">
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
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <div className="text-slate-400 text-6xl font-bold">
                    {movie.title.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{movie.title}</h1>
              
              {movie.description && (
                <p className="text-slate-600 mb-4 leading-relaxed">{movie.description}</p>
              )}
              
              {movie.durationMin && (
                <div className="inline-flex items-center bg-slate-100 px-3 py-1 rounded-full text-sm text-slate-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {movie.durationMin} minutes
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cinemas and Showtimes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Available Cinemas & Showtimes</h2>
            <p className="text-sm text-slate-500">
              Only showing future showtimes
            </p>
          </div>
          
          {cinemaGroups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="text-slate-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Future Showtimes Available</h3>
              <p className="text-slate-600">
                All shows for this movie have already started or ended. 
                <br />
                Please check back later for new showtimes.
              </p>
            </div>
          ) : (
            cinemaGroups.map((group) => (
              <div key={group.cinema.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">{group.cinema.name}</h3>
                  {group.cinema.city && (
                    <p className="text-slate-600">{group.cinema.city}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.shows.map((show) => {
                    const timeStatus = getShowTimeStatus(show.startTime);
                    return (
                      <button
                        key={show.id}
                        onClick={() => handleShowSelect(show)}
                        className={`border rounded-lg p-3 text-left transition-colors relative ${
                          timeStatus.status === 'soon' 
                            ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300' 
                            : 'bg-slate-50 hover:bg-slate-800 hover:text-white border-slate-200 hover:border-slate-800'
                        }`}
                      >
                        {timeStatus.label && (
                          <div className={`absolute top-1 right-1 px-2 py-0.5 text-xs rounded-full ${
                            timeStatus.status === 'soon' 
                              ? 'bg-amber-200 text-amber-800' 
                              : timeStatus.status === 'today'
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {timeStatus.label}
                          </div>
                        )}
                        <div className="text-sm font-medium pr-16">
                          {formatShowTime(show.startTime)}
                        </div>
                        <div className={`text-xs mt-1 ${
                          timeStatus.status === 'soon' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {show.screen.name} • ₹{show.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;