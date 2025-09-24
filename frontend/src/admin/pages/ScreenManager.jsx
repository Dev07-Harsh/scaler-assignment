import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  TvIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { adminAPI, cinemasAPI } from '../../api/services';

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

const ScreenManager = () => {
  const [screens, setScreens] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCinema, setSelectedCinema] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    cinemaId: '',
    capacity: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes
    fetchData();
  }, [debouncedSearchQuery, selectedCinema]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = { page: currentPage, limit: 20 };
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (selectedCinema) params.cinemaId = selectedCinema;
      
      const [screensResponse, cinemasResponse] = await Promise.all([
        adminAPI.getScreens(params),
        cinemasAPI.getCinemas({ limit: 100 })
      ]);
      
      setScreens(screensResponse.data.data || []);
      setTotal(screensResponse.data.meta?.total || 0);
      setTotalPages(screensResponse.data.meta?.totalPages || 1);
      setCinemas(cinemasResponse.data.data || []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.cinemaId) {
      setError('Screen name and cinema are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        cinemaId: parseInt(formData.cinemaId),
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      };

      if (editingScreen) {
        await adminAPI.updateScreen(editingScreen.id, submitData);
      } else {
        await adminAPI.createScreen(submitData);
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save screen');
      console.error('Error saving screen:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (screen) => {
    if (!window.confirm(`Are you sure you want to delete "${screen.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteScreen(screen.id);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete screen');
      console.error('Error deleting screen:', err);
    }
  };

  const handleEdit = (screen) => {
    setEditingScreen(screen);
    setFormData({
      name: screen.name,
      cinemaId: screen.cinemaId.toString(),
      capacity: screen.capacity ? screen.capacity.toString() : ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingScreen(null);
    setFormData({
      name: '',
      cinemaId: '',
      capacity: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingScreen(null);
    setFormData({
      name: '',
      cinemaId: '',
      capacity: ''
    });
    setError(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Screen Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage screens across all cinema locations
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 rounded-md bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Screen
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
            placeholder="Search screens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>

        {/* Cinema Filter */}
        <div>
          <select
            value={selectedCinema}
            onChange={(e) => setSelectedCinema(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
          >
            <option value="">All Cinemas</option>
            {cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id.toString()}>
                {cinema.name}
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

      {/* Screens Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Screen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cinema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shows
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {screens.map((screen) => (
                <tr key={screen.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <TvIcon className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {screen.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{screen.cinema?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screen.capacity || '-'} seats
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screen._count?.shows || 0} shows
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(screen)}
                        className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Edit screen"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(screen)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete screen"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {screens.length === 0 && (
            <div className="text-center py-12">
              <TvIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No screens found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedCinema ? 'Try adjusting your filters.' : 'Get started by creating a new screen.'}
              </p>
              {!searchQuery && !selectedCinema && (
                <div className="mt-6">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-x-2 rounded-md bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Screen
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
                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 20, total)}</span> of{' '}
                <span className="font-medium">{total}</span> screens
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
                        {editingScreen ? 'Edit Screen' : 'Add New Screen'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="cinema" className="block text-sm font-medium text-gray-700 mb-1">
                            Cinema *
                          </label>
                          <select
                            id="cinema"
                            value={formData.cinemaId}
                            onChange={(e) => setFormData({ ...formData, cinemaId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            required
                          >
                            <option value="">Select a cinema</option>
                            {cinemas.map((cinema) => (
                              <option key={cinema.id} value={cinema.id}>
                                {cinema.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Screen Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            placeholder="e.g., Screen 1, IMAX, VIP"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                            Seating Capacity
                          </label>
                          <input
                            type="number"
                            id="capacity"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                            placeholder="e.g., 100"
                            min="1"
                            max="1000"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Total number of seats in this screen
                          </p>
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
                    {submitting ? 'Saving...' : (editingScreen ? 'Update' : 'Create')}
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

export default ScreenManager;