import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Gallery } from './components/Gallery';
import { FolderView } from './components/FolderView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicFolderView } from './components/PublicFolderView';
import HomePage from './components/HomePage';
import PricingPage from './components/PricingPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Shared folder browsing routes (public, not wrapped in ProtectedRoute) */}
          <Route path="/shared/folder" element={<PublicFolderView />} />
          <Route path="/shared/folder/:params" element={<PublicFolderView />} />

          {/* Auth-protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            }
          />
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
          <Route path="/login" element={<AuthForm />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
