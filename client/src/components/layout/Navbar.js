import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import logo from './logo.jpg'; // Import your logo image

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
      { path: '/admin/users', label: 'Users' }, // Changed to 'Users' for broader admin view
      { path: '/admin/requests', label: 'Requests' }
    ]
  };

  const NavItem = ({ path, label }) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `px-4 py-2 transition-colors duration-200 rounded-lg text-sm font-medium
        ${isActive ? 'bg-white/25 text-white' : 'hover:bg-white/15 text-white'}`
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
    <header className="p-2 mx-12 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-xl sticky top-0 z-50 rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Name and Logo */}
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight flex items-center group"
          >
            <img src={logo} alt="Academic Verifier Logo" className="h-10 w-auto mr-3 rounded-full shadow-md" /> {/* Added logo */}
            <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:via-cyan-100 group-hover:to-indigo-200 transition-colors duration-200">
              Progress-Tracker
            </span>
          </Link>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex space-x-2">
                  {user?.role && navItems[user.role]?.map((item) => (
                    <NavItem key={item.path} {...item} />
                  ))}
                </div>

                <div className="relative ml-4">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center text-sm rounded-full focus:outline-none ring-2 ring-transparent hover:ring-white/50 transition-all duration-200"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center font-semibold text-lg text-white shadow-md hover:bg-blue-800 transition-colors duration-200">
                      {getUserInitial()}
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in"
                      role="menu"
                    >
                      <div className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200">
                        <div className="font-semibold truncate">{user?.email || 'User'}</div>
                        <div className="text-xs text-gray-500 capitalize">{user?.role || 'unknown'}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/register?role=student"
                  className="px-6 py-2 rounded-xl text-sm font-semibold bg-white text-blue-700 hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Register Student
                </Link>
                <Link
                  to="/register?role=institution"
                  className="px-6 py-2 rounded-xl text-sm font-semibold bg-white text-indigo-700 hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Register Institution
                </Link>
                <NavLink
                  to="/login"
                  className="px-6 py-2 rounded-xl text-sm font-semibold border border-white/30 text-white hover:bg-white/15 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Sign In
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