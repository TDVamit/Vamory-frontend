# Recycle Bin Feature

## Overview
The Recycle Bin feature allows users to view, restore, and permanently delete files that have been moved to the trash. Files in the recycle bin are automatically deleted after 30 days.

## Features

### 1. View Deleted Files
- Displays all deleted files with pagination
- Shows file thumbnails, names, sizes, and original folder locations
- Displays days remaining until permanent deletion
- Supports search functionality
- Multiple sorting options (deleted date, filename, file size)

### 2. File Operations
- **Restore**: Move files back to their original folder
- **Permanent Delete**: Immediately and permanently remove files
- **View**: Open standard files in the media gallery (archived files cannot be opened)

### 3. Storage Type Handling
- **Standard Files**: Can be viewed, restored, and permanently deleted
- **Archived Files**: Can be restored and permanently deleted, but cannot be viewed (marked with "Archived" badge)

### 4. Access Points
- **Profile Dropdown**: "Recycle Bin" option in the user profile menu
- **Gallery Page**: "Recycle Bin" option in the action dropdown menu

## API Endpoints Used

### Get Trash Files
```
GET /api/v1/files/trash?page=1&per_page=20&sort_by=deleted_at&sort_order=desc
```

### Restore File
```
POST /api/v1/files/{file_id}/restore
```

### Permanent Delete File
```
DELETE /api/v1/files/{file_id}/permanent
```

## Components Created

### 1. `useTrash` Hook (`src/hooks/useTrash.ts`)
- Manages trash file state and operations
- Handles pagination, sorting, and search
- Provides restore and permanent delete functionality

### 2. `RecycleBin` Component (`src/components/RecycleBin.tsx`)
- Main recycle bin interface
- Displays deleted files in a grid layout
- Handles file operations and user interactions
- Integrates with MediaGallery for file viewing

## UI Features

### Visual Indicators
- **Days Remaining**: Shows countdown to permanent deletion
- **Storage Type Badge**: "Archived" badge for deep archive files
- **Action Buttons**: Hover overlay with restore, delete, and view options
- **Stats Panel**: Shows total deleted files and files expiring soon

### Responsive Design
- Grid layout adapts to screen size
- Mobile-friendly touch interactions
- Consistent with existing app design patterns

### User Experience
- Confirmation dialogs for destructive actions
- Loading states for async operations
- Error handling and user feedback
- Search and sort functionality
- Infinite scroll for large file lists

## File Structure Changes

### New Files
- `src/hooks/useTrash.ts` - Custom hook for trash management
- `src/components/RecycleBin.tsx` - Main recycle bin component
- `RECYCLE_BIN_FEATURE.md` - This documentation

### Modified Files
- `src/services/api.ts` - Added trash API endpoints
- `src/types/index.ts` - Updated FileData interface with deleted fields
- `src/components/Header.tsx` - Added recycle bin link to profile dropdown
- `src/components/Gallery.tsx` - Added recycle bin option to action dropdown
- `src/App.tsx` - Added recycle bin route

## Security Considerations
- All operations require authentication
- Users can only access their own deleted files
- Confirmation dialogs prevent accidental deletions
- API endpoints validate user permissions

## Future Enhancements
- Bulk restore/delete operations
- Filter by file type or deletion date
- Email notifications for files about to expire
- Custom retention periods per file type
- Recycle bin analytics and reporting
