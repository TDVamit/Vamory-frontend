import { useState, useEffect, useRef } from 'react';
import { X, Upload as UploadIcon, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import api from '../services/api';
import { AdminUserRoleModal } from './AdminUserRoleModal';
import ReactDOM from 'react-dom';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, updateProfilePic, deleteProfilePic, isLoading } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    full_name: '',
    user_role: UserRole.user,
    password: '',
  });
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [addUserFieldErrors, setAddUserFieldErrors] = useState<{ email?: string; full_name?: string; password?: string; user_role?: string }>({});
  // Add a ref to AdminUserRoleModal
  const userRoleModalRef = useRef<{ refreshUsers?: () => void }>(null);

  useEffect(() => {
    if (isOpen && user) setFullName(user.full_name);
  }, [isOpen, user]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/api/v1/auth/me', { full_name: fullName, is_active: true });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const validateAddUserForm = () => {
    const errors: { email?: string; full_name?: string; password?: string; user_role?: string } = {};
    // Email: required, valid format
    if (!addUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(addUserForm.email.trim())) {
      errors.email = 'Invalid email format';
    }
    // Full Name: required, min length 2
    if (!addUserForm.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (addUserForm.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }
    // Password: required, min length 6
    if (!addUserForm.password) {
      errors.password = 'Password is required';
    } else if (addUserForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    // User Role: required
    if (!addUserForm.user_role) {
      errors.user_role = 'User role is required';
    }
    return errors;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);
    const fieldErrors = validateAddUserForm();
    setAddUserFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }
    setAddUserLoading(true);
    try {
      await api.post('/api/v1/auth/register', {
        email: addUserForm.email,
        full_name: addUserForm.full_name,
        user_role: addUserForm.user_role,
        password: addUserForm.password,
        is_active: true,
      });
      setShowAddUser(false);
      setAddUserForm({ email: '', full_name: '', user_role: UserRole.user, password: '' });
      setAddUserFieldErrors({});
      // Refresh user table immediately after adding user
      userRoleModalRef.current?.refreshUsers?.();
    } catch (err: any) {
      setAddUserError(err?.response?.data?.detail || 'Failed to add user');
    } finally {
      setAddUserLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 min-h-screen flex items-center justify-center z-50 overflow-y-auto animate-in bg-black/30">
      <div className="glass bg-black/40 rounded-xl p-8 w-full max-w-2xl mx-4 border border-gray-700/40 animate-slide-up backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Profile</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-red-500/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 mb-6">
          {user?.profile_pic ? (
            <img
              src={user.profile_pic.startsWith('data:') ? user.profile_pic : `data:image/png;base64,${user.profile_pic}`}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border border-gray-500 bg-gray-700"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-700 border border-gray-500">
              <UploadIcon className="w-8 h-8 text-gray-400" />
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-gray-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 transition-all pr-12"
              disabled={!isEditing}
            />
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-700/40 text-gray-400 hover:text-white transition-colors"
                aria-label="Edit Name"
              >
                {/* Modern pencil icon (Lucide Edit3) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182l-11.25 11.25a2 2 0 0 1-.707.464l-4.243 1.414 1.414-4.243a2 2 0 0 1 .464-.707l11.25-11.25Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.5 6.5 17.5 8.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="ml-2 px-4 py-2 bg-blue-700/40 text-white rounded-lg hover:bg-blue-600/50 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(user?.full_name || '');
                  }}
                  className="ml-2 px-4 py-2 bg-gray-700/40 text-white rounded-lg hover:bg-gray-600/50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        {/* Show AdminUserRoleModal inline for super_admin and admins, no button */}
        {(user?.user_role === UserRole.super_admin || user?.user_role === UserRole.admin) && (
          <div className="mt-8">
            <AdminUserRoleModal
              isOpen={true}
              addUserButton={
                <button
                  className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-gray-700/80 font-semibold shadow border border-gray-700/40 transition-all"
                  onClick={() => setShowAddUser(true)}
                >
                  Add User
                </button>
              }
            />
          </div>
        )}
      </div>
      {/* Add User Popup Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass bg-black/60 rounded-xl p-8 w-full max-w-md mx-4 border border-gray-700/40 animate-slide-up shadow-2xl relative">
            <button
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-red-500/10"
              onClick={() => setShowAddUser(false)}
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleAddUser} className="flex flex-col gap-5">
              <h4 className="text-lg font-semibold text-white mb-2">Add New User</h4>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={addUserForm.email}
                  onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))}
                  className="px-4 py-2 rounded-lg bg-black/30 border border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {addUserFieldErrors.email && (
                  <span className="text-red-400 text-xs mt-1">{addUserFieldErrors.email}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={addUserForm.full_name}
                  onChange={e => setAddUserForm(f => ({ ...f, full_name: e.target.value }))}
                  className="px-4 py-2 rounded-lg bg-black/30 border border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {addUserFieldErrors.full_name && (
                  <span className="text-red-400 text-xs mt-1">{addUserFieldErrors.full_name}</span>
                )}
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className="text-sm text-gray-300">Role</label>
                <button
                  type="button"
                  className="flex items-center justify-between px-4 py-2 rounded-lg bg-black/30 border border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  onClick={() => setRoleDropdownOpen(v => !v)}
                >
                  <span className="capitalize">{addUserForm.user_role}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-30 bg-black/90 border border-gray-700/40 rounded-lg shadow-lg py-1">
                    {Object.values(UserRole).map(role => (
                      <button
                        key={role}
                        type="button"
                        className={`w-full text-left px-4 py-2 text-sm capitalize rounded hover:bg-blue-600/30 text-white transition-colors ${addUserForm.user_role === role ? 'bg-blue-700/30 font-semibold' : ''}`}
                        onClick={() => {
                          setAddUserForm(f => ({ ...f, user_role: role as UserRole }));
                          setRoleDropdownOpen(false);
                        }}
                        disabled={addUserForm.user_role === role}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
                {addUserFieldErrors.user_role && (
                  <span className="text-red-400 text-xs mt-1">{addUserFieldErrors.user_role}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={addUserForm.password}
                  onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))}
                  className="px-4 py-2 rounded-lg bg-black/30 border border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {addUserFieldErrors.password && (
                  <span className="text-red-400 text-xs mt-1">{addUserFieldErrors.password}</span>
                )}
              </div>
              {addUserError && <div className="text-red-400 text-sm mt-1">{addUserError}</div>}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-2 bg-black/70 text-white rounded-lg border border-gray-700/40 hover:bg-gray-700/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="flex-1 px-4 py-2 bg-black/80 text-white rounded-lg border border-gray-700/40 hover:bg-blue-700/60 font-semibold shadow disabled:opacity-50 transition-all"
                >
                  {addUserLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
