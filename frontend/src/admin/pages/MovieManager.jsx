import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  FilmIcon,
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { moviesAPI, adminAPI } from '../../api/services';

const MovieManager = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationMin: '',
    posterUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getMovies({ limit: 100 });
      setMovies(response.data.data || []);
    } catch (err) {
      setError('Failed to load movies');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Movie title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        durationMin: formData.durationMin ? parseInt(formData.durationMin) : null
      };

      if (editingMovie) {
        await adminAPI.updateMovie(editingMovie.id, submitData);
      } else {
        await adminAPI.createMovie(submitData);
      }

      await fetchMovies();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save movie');
      console.error('Error saving movie:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Are you sure you want to delete "${movie.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteMovie(movie.id);
      await fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete movie');
      console.error('Error deleting movie:', err);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description || '',
      durationMin: movie.durationMin ? movie.durationMin.toString() : '',
      posterUrl: movie.posterUrl || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      durationMin: '',
      posterUrl: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      durationMin: '',
      posterUrl: ''
    });
    setError(null);
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (movie.description && movie.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
                <div className="h-16 w-12 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
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
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Movie Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your movie catalog and details
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-x-2 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Movie
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-base sm:text-sm"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMovies.map((movie) => (
          <div key={movie.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Movie Poster */}
            <div className="aspect-[2/3] sm:aspect-[3/4] bg-gray-100 relative">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${movie.posterUrl ? 'hidden' : 'flex'}`}>
                <PhotoIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
              </div>
              
              {/* Action buttons overlay */}
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  onClick={() => handleEdit(movie)}
                  className="p-2 sm:p-1.5 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 rounded-md shadow-sm transition-colors"
                  title="Edit movie"
                >
                  <PencilIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => handleDelete(movie)}
                  className="p-2 sm:p-1.5 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 rounded-md shadow-sm transition-colors"
                  title="Delete movie"
                >
                  <TrashIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Movie Details */}
            <div className="p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 sm:line-clamp-1">
                {movie.title}
              </h3>
              
              {movie.description && (
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                  {movie.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                <span className="font-medium">{formatDuration(movie.durationMin)}</span>
                <span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">{movie._count?.shows || 0} shows</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <FilmIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No movies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search query.' : 'Get started by adding a new movie.'}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-x-2 rounded-md bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Add Movie
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 onClick={handleCloseModal}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                        {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Movie Title *
                          </label>
                          <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            placeholder="Enter movie title"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            placeholder="Enter movie description"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="durationMin" className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              id="durationMin"
                              value={formData.durationMin}
                              onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                              placeholder="120"
                              min="1"
                              max="600"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="posterUrl" className="block text-sm font-medium text-gray-700 mb-1">
                              Poster URL
                            </label>
                            <input
                              type="url"
                              id="posterUrl"
                              value={formData.posterUrl}
                              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                              placeholder="https://example.com/poster.jpg"
                            />
                          </div>
                        </div>
                        
                        {/* Poster Preview */}
                        {formData.posterUrl && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Poster Preview
                            </label>
                            <div className="w-32 h-48 bg-gray-100 rounded-md overflow-hidden">
                              <img
                                src={formData.posterUrl}
                                alt="Poster preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full flex items-center justify-center hidden">
                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}
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
                    {submitting ? 'Saving...' : (editingMovie ? 'Update' : 'Create')}
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

export default MovieManager;