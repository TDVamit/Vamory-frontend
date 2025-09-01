import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Gallery } from './components/Gallery';
import { FolderView } from './components/FolderView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicFolderView } from './components/PublicFolderView';
import { PublicFileView } from './components/PublicFileView';
import { FaceDetectionPage } from './components/FaceDetectionPage';
import { FaceDetailPage } from './components/FaceDetailPage';
import { RecycleBin } from './components/RecycleBin';
import HomePage from './components/HomePage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import FAQPage from './components/FAQPage';
import { AuthProvider, useAuth0Custom } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Component to handle root path redirect logic
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth0Custom();
  
  if (isLoading) {
    return (
      <div className="min-h-screen surface-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20">
          <div className="w-8 h-8 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-lg font-medium">Loading Vamory...</span>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/gallery" replace />;
  } else {
    return <Navigate to="/home" replace />;
  }
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Root path with conditional redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Public routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        
        {/* Shared folder browsing routes (public, not wrapped in ProtectedRoute) */}
        <Route path="/shared/folder" element={<PublicFolderView />} />
        <Route path="/shared/folder/:params" element={<PublicFolderView />} />
        <Route path="/shared/file" element={<PublicFileView />} />

        {/* Auth-protected routes */}
        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/folder/:folderId"
          element={
            <ProtectedRoute>
              <FolderView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faces"
          element={
            <ProtectedRoute>
              <FaceDetectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faces/:faceId"
          element={
            <ProtectedRoute>
              <FaceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recycle-bin"
          element={
            <ProtectedRoute>
              <RecycleBin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
