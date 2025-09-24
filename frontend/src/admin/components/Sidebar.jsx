import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  FilmIcon, 
  TvIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, exact: true },
  { name: 'Cinemas', href: '/admin/cinemas', icon: BuildingOfficeIcon },
  { name: 'Movies', href: '/admin/movies', icon: FilmIcon },
  { name: 'Screens', href: '/admin/screens', icon: TvIcon },
  { name: 'Shows', href: '/admin/shows', icon: CalendarDaysIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-gray-100">
            <h1 className="text-xl font-bold text-slate-800">
              MovieBooking Admin
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-1 flex-col pt-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                // Fix active state detection for dashboard
                let isActive;
                if (item.exact) {
                  isActive = location.pathname === item.href;
                } else {
                  isActive = location.pathname.startsWith(item.href) && location.pathname !== '/admin';
                }
                
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200
                        ${isActive
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }
                      `}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="relative z-50 lg:hidden">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-gray-900/80 transition-opacity"
            onClick={() => setOpen(false)}
          />
          
          {/* Sidebar panel */}
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              {/* Close button */}
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button 
                  type="button" 
                  className="-m-2.5 p-2.5 text-white hover:text-gray-300"
                  onClick={() => setOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Sidebar content */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center border-b border-gray-100">
                  <h1 className="text-xl font-bold text-slate-800">
                    Admin Panel
                  </h1>
                </div>
                
                {/* Navigation */}
                <nav className="flex flex-1 flex-col pt-4">
                  <ul role="list" className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => {
                      // Fix active state detection for dashboard
                      let isActive;
                      if (item.exact) {
                        isActive = location.pathname === item.href;
                      } else {
                        isActive = location.pathname.startsWith(item.href) && location.pathname !== '/admin';
                      }
                      
                      return (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            onClick={() => setOpen(false)}
                            className={`
                              group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200
                              ${isActive
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                              }
                            `}
                          >
                            <item.icon
                              className={`h-5 w-5 shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                              }`}
                              aria-hidden="true"
                            />
                            {item.name}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;