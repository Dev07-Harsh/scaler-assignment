import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={isAuthenticated ? "/movies" : "/"} 
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MB</span>
            </div>
            <span className="text-lg sm:text-xl font-semibold text-slate-900">
              MovieBooking
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/movies"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/movies' || location.pathname.startsWith('/movies')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Movies
                </Link>
                
                <Link
                  to="/bookings/history"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/bookings/history'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  History
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <UserCircleIcon className="h-6 w-6 text-slate-400" />
                  <span className="text-sm text-slate-600 hidden lg:block">
                    {user?.name || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-slate-600 hover:text-slate-900 px-3 py-1.5 text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 z-50 bg-gray-900/50" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-slate-200 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Link 
                to={isAuthenticated ? "/movies" : "/"} 
                className="flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MB</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  MovieBooking
                </span>
              </Link>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-slate-100">
                <div className="space-y-2 py-6">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/movies"
                        className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                          location.pathname === '/movies' || location.pathname.startsWith('/movies')
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Movies
                      </Link>
                      
                      <Link
                        to="/bookings/history"
                        className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                          location.pathname === '/bookings/history'
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Booking History
                      </Link>

                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="bg-slate-800 text-white hover:bg-slate-900 -mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="bg-slate-800 text-white hover:bg-slate-900 -mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>

                {/* User Info & Logout */}
                {isAuthenticated && (
                  <div className="py-6">
                    <div className="flex items-center gap-3 -mx-3 px-3 py-3 bg-slate-50 rounded-lg mb-3">
                      <UserCircleIcon className="h-8 w-8 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {user?.name || 'User'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;