import React from 'react';
import { Users, ChevronLeft, ChevronRight, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import type { FaceThumbnail } from '../types';

// Face card component
const FaceCard: React.FC<{ face: FaceThumbnail }> = ({ face }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/faces/${face.face_id}`);
  };

  // Calculate crop style based on bbox
  const getCropStyle = () => {
    const { xmin, ymin } = face.thumbnail_bbox;
    return {
      objectPosition: `${xmin * 100}% ${ymin * 100}%`,
      objectFit: 'cover' as const,
    };
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 group glass"
    >
      {/* Face Image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-700 mb-3">
        <img
          src={face.thumbnail_s3_url}
          alt={face.name || 'Unknown face'}
          className="w-full h-full"
          style={getCropStyle()}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Face Info */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className={`text-sm font-medium ${
            face.name ? 'text-white' : 'text-red-400'
          }`}>
            {face.name || 'No Name'}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
          <Users className="w-3 h-3" />
          <span>{face.total_file_references} photo{face.total_file_references !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};

// Pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
             <button
         onClick={() => onPageChange(currentPage - 1)}
         disabled={currentPage === 1}
         className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all glass"
       >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page) => (
                 <button
           key={page}
           onClick={() => onPageChange(page)}
           className={`px-3 py-2 rounded-lg border transition-all ${
             page === currentPage
               ? 'bg-blue-600 border-blue-500 text-white'
               : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 glass'
           }`}
         >
          {page}
        </button>
      ))}

               <button
           onClick={() => onPageChange(currentPage + 1)}
           disabled={currentPage === totalPages}
           className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all glass"
         >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export const FaceDetectionPage: React.FC = () => {
  const { faces, currentPage, totalPages, totalCount, loading, error, fetchFaces } = useFaceDetection();
  const navigate = useNavigate();

  const handlePageChange = (page: number) => {
    fetchFaces(page);
  };

  if (loading && faces.length === 0) {
    return (
      <div className="min-h-screen surface-dark">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading faces...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen surface-dark">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchFaces(currentPage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-dark">
      <Header />
             <div className="container mx-auto px-4 py-8 pt-20">
         {/* Header */}
         <div className="flex items-center gap-4 mb-8">
           <button
             onClick={() => navigate('/gallery')}
             className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all glass"
           >
             <ArrowLeft className="w-5 h-5 text-white" />
           </button>
           <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Face Detection</h1>
          </div>
          <p className="text-gray-400">
            Discover and manage all detected faces in your photos
          </p>
                     {totalCount > 0 && (
             <p className="text-sm text-gray-500 mt-2">
               {totalCount} face{totalCount !== 1 ? 's' : ''} found
             </p>
           )}
           </div>
         </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          </div>
        )}

        {/* Faces Grid */}
        {faces.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Faces Found</h3>
            <p className="text-gray-500">
              No faces have been detected in your photos yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
            {faces.map((face) => (
              <FaceCard key={face.face_id} face={face} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};
