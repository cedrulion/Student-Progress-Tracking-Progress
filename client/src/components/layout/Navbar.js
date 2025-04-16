import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  // Role-based navigation items
  const navItems = {
    student: [
      { path: '/student/dashboard', label: 'Dashboard' },
      { path: '/student/profile', label: 'Profile' },
      { path: '/student/transcripts', label: 'Transcripts' }
    ],
    institution: [
      { path: '/institution/dashboard', label: 'Dashboard' },
      { path: '/institution/students', label: 'Students' },
      { path: '/institution/requests', label: 'Requests' }
    ],
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard' },
      { path: '/admin/institutions', label: 'Institutions' },
      { path: '/admin/students', label: 'Students' },
      { path: '/admin/requests', label: 'Requests' }
    ]
  };

  const NavItem = ({ path, label }) => (
    <NavLink
      to={path}
      className={({ isActive }) => 
        `px-3 py-2 transition-colors duration-200 rounded-md text-sm font-medium
        ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
      }
    >
      {label}
    </NavLink>
  );

  const getUserInitial = () => {
    if (!user || !user.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="text-xl font-bold tracking-tight flex items-center"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            ProgressTrack
          </Link>
          
          <nav className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex space-x-1">
                  {user?.role && navItems[user.role]?.map((item) => (
                    <NavItem key={item.path} {...item} />
                  ))}
                </div>
                
                <div className="relative ml-4">
                  <button 
                    onClick={toggleDropdown}
                    className="flex items-center text-sm rounded-full focus:outline-none"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      {getUserInitial()}
                    </div>
                  </button>
                  
                  {isDropdownOpen && (
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                    >
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium truncate">{user?.email || 'User'}</div>
                        <div className="text-xs text-gray-500 capitalize">{user?.role || 'unknown'}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <NavLink
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-200"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                >
                  Register
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;