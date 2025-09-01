import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, DollarSign,  Bell, Users, Trash2 } from 'lucide-react';
import { useAuth0Custom } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';
import { Link, useLocation } from 'react-router-dom';
import { useProfileImage } from '../hooks/useProfileImage';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPopup } from './NotificationPopup';

export const Header = () => {
  const { user, auth0User, logout, isAuthenticated, login } = useAuth0Custom();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { hasNotifications } = useNotifications(isAuthenticated);
  
  // Use the profile image hook to handle Google profile images with proper headers
  const profileImageUrl = user?.profile_pic_url || auth0User?.picture;
  const { imageUrl, isLoading } = useProfileImage(profileImageUrl);

  // Handle click outside to close menus
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
            {isAuthenticated && (
              <button
                onClick={() => setShowNotificationPopup(true)}
                className={`relative p-2 rounded-lg transition-all ${
                  hasNotifications
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-300 hover:bg-gray-700/30'
                }`}
              >
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
            )}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 text-gray-300 bg-gray-800/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-600/20 hover:bg-gray-700/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-gray-500 bg-gray-700"
                        onError={(e) => {
                          // Fallback to user icon if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {!imageUrl && !isLoading && (
                      <User className="w-7 h-7 text-gray-400 rounded-full bg-gray-700 border border-gray-500" />
                    )}
                    {isLoading && (
                      <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-500 animate-pulse"></div>
                    )}
                    <span className="text-sm font-medium text-white ml-2">{user?.full_name || auth0User?.name}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-12 bg-black/90 rounded-lg shadow-2xl border border-gray-600/50 py-1 min-w-[180px]" style={{backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)'}}>
                    <button
                      onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-black/30 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <Link
                      to="/faces"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-black/30 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Face Detection
                    </Link>
                    <Link
                      to="/recycle-bin"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-black/30 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Recycle Bin
                    </Link>
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
      <NotificationPopup 
        isOpen={showNotificationPopup} 
        onClose={() => setShowNotificationPopup(false)} 
      />
    </header>
  );
};