import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { showsAPI, adminAPI, moviesAPI } from '../../api/services';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ShowManager = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    movieId: '',
    screenId: '',
    startTime: '',
    price: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes
    fetchData();
  }, [debouncedSearchQuery, selectedMovie]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = { page: currentPage, limit: 50 };
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (selectedMovie) params.movieId = selectedMovie;
      
      const [showsResponse, moviesResponse, screensResponse] = await Promise.all([
        showsAPI.getShows(params),
        moviesAPI.getMovies({ limit: 100 }),
        adminAPI.getScreens({ limit: 100 })
      ]);
      
      setShows(showsResponse.data.data || []);
      setTotal(showsResponse.data.meta?.total || 0);
      setTotalPages(showsResponse.data.meta?.totalPages || 1);
      setMovies(moviesResponse.data.data || []);
      setScreens(screensResponse.data.data || []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.screenId || !formData.startTime || !formData.price) {
      setError('All fields are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        movieId: parseInt(formData.movieId),
        screenId: parseInt(formData.screenId),
        price: parseFloat(formData.price),
        startTime: new Date(formData.startTime).toISOString()
      };

      if (editingShow) {
        await adminAPI.updateShow(editingShow.id, submitData);
      } else {
        await adminAPI.createShow(submitData);
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save show');
      console.error('Error saving show:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (show) => {
    if (!window.confirm(`Are you sure you want to delete this show? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteShow(show.id);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete show');
      console.error('Error deleting show:', err);
    }
  };

  const handleEdit = (show) => {
    setEditingShow(show);
    const startTime = new Date(show.startTime);
    const localDateTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    
    setFormData({
      movieId: show.movieId.toString(),
      screenId: show.screenId.toString(),
      startTime: localDateTime,
      price: show.price.toString()
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingShow(null);
    setFormData({
      movieId: '',
      screenId: '',
      startTime: '',
      price: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShow(null);
    setFormData({
      movieId: '',
      screenId: '',
      startTime: '',
      price: ''
    });
    setError(null);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isShowInPast = (startTime) => {
    return new Date(startTime) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-pulse p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Show Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage movie shows across all screens
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 rounded-md bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Show
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search shows, movies, screens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>

        {/* Movie Filter */}
        <div>
          <select
            value={selectedMovie}
            onChange={(e) => setSelectedMovie(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
          >
            <option value="">All Movies</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id.toString()}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Shows Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Movie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Screen & Cinema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shows.map((show) => {
                const { date, time } = formatDateTime(show.startTime);
                const isPast = isShowInPast(show.startTime);
                
                return (
                  <tr key={show.id} className={`hover:bg-gray-50 ${isPast ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {show.movie?.title}
                      </div>
                      {show.movie?.durationMin && (
                        <div className="text-sm text-gray-500">
                          {Math.floor(show.movie.durationMin / 60)}h {show.movie.durationMin % 60}m
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{show.screen?.name}</div>
                      <div className="text-sm text-gray-500">{show.screen?.cinema?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">{date}</div>
                          <div className="text-sm text-gray-500">{time}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{show.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {show._count?.bookings || 0} bookings
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/shows/${show.id}/seats`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View seat layout"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(show)}
                          className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Edit show"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(show)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete show"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {shows.length === 0 && (
            <div className="text-center py-12">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shows found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedMovie ? 'Try adjusting your filters.' : 'Get started by scheduling a new show.'}
              </p>
              {!searchQuery && !selectedMovie && (
                <div className="mt-6">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-x-2 rounded-md bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Show
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 50) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 50, total)}</span> of{' '}
                <span className="font-medium">{total}</span> shows
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-slate-50 border-slate-500 text-slate-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 onClick={handleCloseModal}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                        {editingShow ? 'Edit Show' : 'Schedule New Show'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="movie" className="block text-sm font-medium text-gray-700 mb-1">
                            Movie *
                          </label>
                          <select
                            id="movie"
                            value={formData.movieId}
                            onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            required
                          >
                            <option value="">Select a movie</option>
                            {movies.map((movie) => (
                              <option key={movie.id} value={movie.id}>
                                {movie.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="screen" className="block text-sm font-medium text-gray-700 mb-1">
                            Screen *
                          </label>
                          <select
                            id="screen"
                            value={formData.screenId}
                            onChange={(e) => setFormData({ ...formData, screenId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            required
                          >
                            <option value="">Select a screen</option>
                            {screens.map((screen) => (
                              <option key={screen.id} value={screen.id}>
                                {screen.cinema?.name} - {screen.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date & Time *
                          </label>
                          <input
                            type="datetime-local"
                            id="startTime"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            Ticket Price (₹) *
                          </label>
                          <input
                            type="number"
                            id="price"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            placeholder="e.g., 150"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full justify-center rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Saving...' : (editingShow ? 'Update' : 'Schedule')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowManager;