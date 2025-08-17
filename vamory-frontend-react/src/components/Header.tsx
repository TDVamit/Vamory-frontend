import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, DollarSign, Coins } from 'lucide-react';
import { useAuth0Custom } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';
import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const { user, auth0User, logout, isAuthenticated, login } = useAuth0Custom();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20">
      <div className="max-w-7xl w-full mx-auto px-6 min-w-0">
        <div className="flex items-center justify-between h-14 min-w-0">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/home" className="flex items-center">
              <img src="/VD Logo Funky.png" alt="Vamory Logo" className="w-10 h-10 object-contain" />
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4">
              {isAuthenticated && (
                <Link
                  to="/gallery"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/gallery'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm font-medium">Gallery</span>
                </Link>
              )}
              <Link
                to="/pricing"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/pricing'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Pricing</span>
              </Link>
            </nav>
          </div>

          {/* Right side - Profile and logout */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-yellow-400/20">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-medium">{user.credits || 0} Credits</span>
              </div>
            )}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 text-gray-300 bg-gray-800/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-600/20 hover:bg-gray-700/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {user?.profile_pic_url || auth0User?.picture ? (
                      <img
                        src={user?.profile_pic_url || auth0User?.picture}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-gray-500 bg-gray-700"
                      />
                    ) : (
                      <User className="w-7 h-7 text-gray-400 rounded-full bg-gray-700 border border-gray-500" />
                    )}
                    <span className="text-sm font-medium text-white ml-2">{user?.full_name || auth0User?.name}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-12 bg-black/40 glass rounded-lg shadow-lg border border-gray-700/30 py-1 min-w-[180px]">
                    <button
                      onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-black/30 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-red-900/30 hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
};