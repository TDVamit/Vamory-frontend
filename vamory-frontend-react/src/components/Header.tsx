import { useState, useRef, useEffect } from 'react';
import { Plus, User, LogOut, ChevronDown, Trash2, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onCreateFolder: () => void;
  showCreateButton?: boolean;
}

export const Header = ({ onCreateFolder, showCreateButton = true }: HeaderProps) => {
  const { user, logout, updateProfilePic, deleteProfilePic, isLoading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await updateProfilePic(file);
    } catch (err) {
      setUploadError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProfilePic = async () => {
    setUploadError(null);
    setIsUploading(true);
    try {
      await deleteProfilePic();
    } catch (err) {
      setUploadError('Delete failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Logo and Create folder button */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center">
              <img src="/VD Logo Funky.png" alt="Vamory Logo" className="w-10 h-10 object-contain" />
            </a>
            {showCreateButton && (
              <button
                onClick={onCreateFolder}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium bg-gray-800/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-600/20 hover:bg-gray-700/30"
              >
                <Plus size={16} />
                New Folder
              </button>
            )}
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
                <div className="absolute right-0 top-12 bg-gray-800/30 backdrop-blur-sm rounded-lg shadow-lg border border-gray-600/20 py-1 min-w-[180px]">
                  <div className="px-4 py-3 border-b border-gray-700/40 flex flex-col items-center gap-2">
                    {user?.profile_pic ? (
                      <img
                        src={user.profile_pic.startsWith('data:') ? user.profile_pic : `data:image/png;base64,${user.profile_pic}`}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border border-gray-500 bg-gray-700 mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-700 border border-gray-500 mb-2">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
                      <UploadIcon className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicChange}
                        disabled={isUploading || isLoading}
                      />
                    </label>
                    {user?.profile_pic && (
                      <button
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 mt-1"
                        onClick={handleDeleteProfilePic}
                        disabled={isUploading || isLoading}
                      >
                        <Trash2 className="w-4 h-4" /> Delete Photo
                      </button>
                    )}
                    {uploadError && <div className="text-xs text-red-400 mt-1">{uploadError}</div>}
                  </div>
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
    </header>
  );
}; 