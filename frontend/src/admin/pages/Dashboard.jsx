import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  FilmIcon, 
  TvIcon, 
  TicketIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../api/services';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      console.log('Dashboard API response:', response.data);
      // Extract the data from the nested structure
      const dashboardData = response.data.data;
      setStats({
        ...dashboardData.overview,
        recentBookings: dashboardData.recentBookings,
        topMovies: dashboardData.topMovies
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={fetchDashboardData}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Cinemas',
      value: stats?.totalCinemas || 0,
      icon: BuildingOfficeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Total Movies',
      value: stats?.totalMovies || 0,
      icon: FilmIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Total Screens',
      value: stats?.totalScreens || 0,
      icon: TvIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Active Shows',
      value: stats?.totalShows || 0,
      icon: TicketIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: "Today's Bookings",
      value: stats?.totalBookings || 0,
      icon: UserGroupIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      name: "Today's Revenue",
      value: `₹${(stats?.todayRevenue || 0).toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your movie booking platform
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {stats?.recentBookings && stats.recentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.show?.movie?.title} • {booking.show?.screen?.cinema?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                      {new Date(booking.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{booking.totalPrice}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.seatCount || booking.seats?.length || 0} seats
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;