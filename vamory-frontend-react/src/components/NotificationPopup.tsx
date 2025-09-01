import React, { useState } from 'react';
import { Bell, X, Users, Coins, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth0Custom } from '../contexts/AuthContext';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { StorageChart } from './StorageChart';
import type { Notification, UnknownFace } from '../types';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth0Custom();
  const navigate = useNavigate();
  const {
    notifications,
    unknownFaces,
    unreadCount,
    unknownFacesCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    initializeData,
  } = useNotifications(isAuthenticated);

  const [activeTab, setActiveTab] = useState<'notifications' | 'unknown-faces' | 'credits'>('notifications');

  // Handle tab changes
  const handleTabChange = (tab: 'notifications' | 'unknown-faces' | 'credits') => {
    setActiveTab(tab);
    // Note: Auto-mark as read is now handled by the useEffect when popup opens
  };

  // Initialize data when popup opens
  React.useEffect(() => {
    if (isOpen) {
      initializeData();
    }
  }, [isOpen, initializeData]);

  // Auto-mark notifications as read when popup opens and notifications are loaded
  React.useEffect(() => {
    if (isOpen && !loading && notifications.length > 0 && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isOpen, loading, notifications.length, unreadCount, markAllAsRead]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.notification_read) {
      await markAsRead(notification._id);
    }
  };

  const handleUnknownFaceClick = (face: UnknownFace) => {
    // Navigate to specific face detail page
    navigate(`/faces/${face.face_id}`);
    onClose(); // Close the popup after navigation
  };

  return createPortal(
    <div className="fixed inset-0 flex items-start justify-center bg-black/10 pt-20 pb-4" style={{ zIndex: 99999 }}>
      <div className="backdrop-blur-2xl bg-black/20 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative border border-gray-700 max-h-[calc(100vh-120px)] overflow-y-auto mx-2">
                 {/* Header */}
         <button
           className="absolute top-3 right-3 text-gray-400 hover:text-white"
           onClick={onClose}
         >
           <X className="w-6 h-6" />
         </button>
         
         <div className="flex flex-col items-center mb-8">
           <Bell className="w-16 h-16 text-blue-400 mb-3 drop-shadow" />
           <h2 className="text-2xl xs:text-2xl sm:text-3xl font-semibold text-white mb-2 tracking-wide">Notifications</h2>
         </div>

                  {/* Tabs */}
         <div className="flex gap-3 mb-6 flex-wrap justify-center">
           <button
             onClick={() => handleTabChange('notifications')}
             className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow border transition-all ${
               activeTab === 'notifications'
                 ? 'bg-blue-800/60 text-blue-200 border-blue-700'
                 : 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700/60'
             }`}
           >
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </button>
                     <button
             onClick={() => handleTabChange('unknown-faces')}
             className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow border transition-all ${
               activeTab === 'unknown-faces'
                 ? 'bg-blue-800/60 text-blue-200 border-blue-700'
                 : 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700/60'
             }`}
           >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Unknown Faces</span>
            {unknownFacesCount > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                {unknownFacesCount}
              </span>
            )}
          </button>
                     <button
             onClick={() => handleTabChange('credits')}
             className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow border transition-all ${
               activeTab === 'credits'
                 ? 'bg-blue-800/60 text-blue-200 border-blue-700'
                 : 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700/60'
             }`}
           >
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">Credits</span>
          </button>
        </div>

                 {/* Content */}
         <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && !loading && (
            <div className="p-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                                     <div className={`flex justify-between items-center pb-3 border-b border-white/10 transition-all duration-500 ease-in-out ${
                     unreadCount > 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                   }`}>
                     <span className="text-sm text-gray-400">
                       {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                     </span>
                     <button
                       onClick={markAllAsRead}
                       className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                     >
                       Mark all as read
                     </button>
                   </div>
                  
                  {notifications.map((notification) => (
                                         <div
                       key={notification._id}
                       onClick={() => handleNotificationClick(notification)}
                       className={`flex justify-between items-center py-3 px-4 rounded-lg cursor-pointer transition-all duration-500 ease-in-out ${
                         notification.notification_read
                           ? 'hover:bg-gray-800/30 opacity-60'
                           : 'bg-blue-800/20 hover:bg-blue-800/30 opacity-100'
                       }`}
                     >
                                                                      <div className="flex-1">
                           <p className={`text-sm transition-all duration-500 ease-in-out ${
                             notification.notification_read ? 'text-gray-400' : 'text-white font-medium'
                           }`}>
                             {notification.message}
                           </p>
                         <div className="flex items-center gap-2 mt-1">
                           <Clock className="w-3 h-3 text-gray-500" />
                           <span className="text-xs text-gray-500">
                             {formatDate(notification.created_at)}
                           </span>
                         </div>
                       </div>
                                                <div className="flex items-center gap-2">
                           <span className={`text-xs px-2 py-1 rounded-full border transition-all duration-500 ease-in-out ${
                             !notification.notification_read
                               ? 'text-red-400 bg-red-800/30 border-red-700/50 opacity-100'
                               : 'opacity-0 scale-95'
                           }`}>
                             Unread
                           </span>
                         </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unknown Faces Tab */}
          {activeTab === 'unknown-faces' && !loading && (
            <div className="p-4">
              {unknownFaces.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No unknown faces detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-400 pb-3 border-b border-white/10">
                    {unknownFacesCount} unknown face{unknownFacesCount !== 1 ? 's' : ''} detected
                  </div>
                  
                  {unknownFaces.map((face) => (
                                         <div
                       key={face.face_id}
                       onClick={() => handleUnknownFaceClick(face)}
                       className="flex justify-between items-center py-3 px-4 rounded-lg cursor-pointer transition-all hover:bg-gray-800/30"
                     >
                                             <div className="flex items-center gap-3">
                         {face.file_references[0] && (
                           <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700">
                             <img
                               src={face.file_references[0].s3_url}
                               alt="Unknown face"
                               className="w-full h-full object-cover"
                             />
                           </div>
                         )}
                         <div className="flex-1">
                           <p className="text-sm text-white font-medium">
                             Unknown Face #{face.face_id.slice(-6)}
                           </p>
                           <p className="text-xs text-gray-400">
                             {face.file_references.length} photo{face.file_references.length !== 1 ? 's' : ''} • 
                             {formatDate(face.file_references[0]?.added_at || '')}
                           </p>
                         </div>
                       </div>
                       <div className="text-xs text-yellow-400 bg-yellow-800/30 px-2 py-1 rounded-full border border-yellow-700/50">
                         Review
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                     {/* Credits Tab */}
           {activeTab === 'credits' && (
             <div className="space-y-6">
               <div className="text-center flex flex-col items-center">
                 <Coins className="w-16 h-16 text-yellow-400 mb-3 drop-shadow" />
                 <div className="text-2xl font-bold text-white mb-2">
                   {user?.credits || 0} Credits
                 </div>
                 <p className="text-sm text-gray-400 mb-6">
                   Credits are used for storage and processing
                 </p>
               </div>
               
                               {/* Storage Usage Chart */}
                {user && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white text-center">Storage Usage</h3>
                    <div className="flex justify-center">
                      <StorageChart
                        storageUsedStandard={user.storage_used_standard}
                        storageUsedArchived={user.storage_used_archived}
                        storageUsedStandardDeleted={user.storage_used_standard_deleted}
                        storageUsedArchivedDeleted={user.storage_used_archived_deleted}
                      />
                    </div>
                  </div>
                )}
             </div>
           )}
                 </div>
       </div>
     </div>,
     document.body
   );
 };
