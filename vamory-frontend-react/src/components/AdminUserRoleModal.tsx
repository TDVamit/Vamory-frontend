import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import api from '../services/api';
import { usersAPI } from '../services/api';
import { UserRole } from '../types';
import { ChevronDown } from 'lucide-react';

interface AdminUserRoleModalProps {
  isOpen: boolean;
  addUserButton?: React.ReactNode;
}

interface UserListItem {
  _id: string;
  full_name: string;
  email: string;
  user_role: UserRole;
  profile_pic?: string;
}

export const AdminUserRoleModal = forwardRef(function AdminUserRoleModal(
  { isOpen, addUserButton }: AdminUserRoleModalProps,
  ref
) {
  const [users, setUsers] = useState<UserListItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchUsers(1);
    // eslint-disable-next-line
  }, [isOpen]);

  const fetchUsers = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersAPI.searchUsers({ page: pageNum, per_page: 12 });
      setUsers((res.users || []).map(u => ({
        _id: u._id,
        full_name: u.full_name,
        email: u.email,
        user_role: u.user_role || UserRole.user,
        profile_pic: u.profile_pic,
      })));
      setTotalPages(res.meta?.page_count || 1);
      setPage(pageNum);
    } catch (e) {
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setRoleUpdating(userId);
    setError(null);
    // Optimistically update UI, but revert if API fails
    const prevUsers = users ? [...users] : [];
    setUsers(users => (users ? users.map(u => u._id === userId ? { ...u, user_role: newRole } : u) : users));
    try {
      await api.patch(`/api/v1/auth/users/${userId}/role?user_role=${encodeURIComponent(newRole)}`);
      // Success: keep new role
    } catch (e) {
      // Revert to previous state if failed
      setUsers(prevUsers);
    } finally {
      setRoleUpdating(null);
      setOpenDropdown(null);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshUsers: () => fetchUsers(1)
  }));

  if (!isOpen) return null;

  return (
    <div className="relative w-full">
      <div className="glass bg-black/40 rounded-2xl p-8 w-full max-w-5xl mx-auto border border-gray-700/40 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white tracking-tight">Manage User Roles</h3>
          {addUserButton}
        </div>
        <div className="space-y-1">
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-lg">Loading users...</div>
          ) : users && users.length > 0 ? (
            users.map(user => (
              <div key={user._id} className="flex items-center gap-3 bg-black/50 glass rounded-lg border border-gray-700/30 px-3 py-2 hover:bg-black/60 transition-all">
                <div className="flex-shrink-0">
                  {user.profile_pic ? (
                    <img src={user.profile_pic.startsWith('data:') ? user.profile_pic : `data:image/webp;base64,${user.profile_pic}`} alt={user.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-700 bg-gray-800 shadow" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400 text-lg font-bold border border-gray-700">{user.full_name?.[0] || '?'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-base truncate">{user.full_name}</div>
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                </div>
                <div className="ml-2 relative">
                  <button
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700/30 bg-black/30 text-white min-w-[110px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow transition-all ${roleUpdating === user._id ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                    disabled={roleUpdating === user._id}
                    type="button"
                  >
                    <span className="capitalize">{user.user_role}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {openDropdown === user._id && (
                    <div className="absolute right-0 mt-2 z-30 min-w-[120px] bg-black/90 border border-gray-700/40 rounded-lg shadow-lg py-1">
                      {Object.values(UserRole).map(role => (
                        <button
                          key={role}
                          className={`w-full text-left px-4 py-2 text-sm capitalize rounded hover:bg-blue-600/30 text-white transition-colors ${user.user_role === role ? 'bg-blue-700/30 font-semibold' : ''}`}
                          onClick={() => handleRoleChange(user._id, role as UserRole)}
                          disabled={user.user_role === role || roleUpdating === user._id}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-lg">No users found.</div>
          )}
        </div>
        <div className="flex justify-between items-center mt-6 gap-4">
          <button disabled={page === 1} onClick={() => fetchUsers(page - 1)} className="px-4 py-1.5 bg-gray-700/40 text-white rounded-lg hover:bg-gray-600/60 disabled:opacity-50 font-semibold transition-all">Prev</button>
          <span className="text-gray-300 text-base">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => fetchUsers(page + 1)} className="px-4 py-1.5 bg-gray-700/40 text-white rounded-lg hover:bg-gray-600/60 disabled:opacity-50 font-semibold transition-all">Next</button>
        </div>
      </div>
    </div>
  );
});
