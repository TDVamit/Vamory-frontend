import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProfileModal } from './ProfileModal';

export const Header = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto px-6 min-w-0">
        <div className="flex items-center justify-between h-14 min-w-0">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center">
              <img src="/VD Logo Funky.png" alt="Vamory Logo" className="w-10 h-10 object-contain" />
            </a>
          </div>

          {/* Right side - Profile and logout */}
          <div className="flex items-center">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 text-gray-300 bg-gray-800/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-600/20 hover:bg-gray-700/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {user?.profile_pic ? (
                    <img
                      src={user.profile_pic.startsWith('data:') ? user.profile_pic : `data:image/png;base64,${user.profile_pic}`}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border border-gray-500 bg-gray-700"
                    />
                  ) : (
                    <User className="w-7 h-7 text-gray-400 rounded-full bg-gray-700 border border-gray-500" />
                  )}
                  <span className="text-sm font-medium text-white ml-2">{user?.full_name}</span>
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
          </div>
        </div>
      </div>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
};