import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Dashboard } from './Dashboard';
import { FormRouter } from '../components/forms/FormRouter';
import { useApi } from '../hooks/useApi';
import { ContentData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useRepo } from '../hooks/useRepo';

type AppState = 'dashboard' | 'editing';

/**
 * Dashboard Wrapper Component
 * Maintains the original dashboard functionality within the authenticated app
 */
export function DashboardWrapper() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>('dashboard');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<ContentData | null>(null);
  const { loading, error, loadContent, saveContent, generateHtml, clearError } = useApi();
  const { user, logout } = useAuth();
  const { loading: repoLoading, hasActiveRepo } = useRepo();

  // Redirect to setup if no active repository
  useEffect(() => {
    if (!repoLoading && !hasActiveRepo) {
      navigate('/setup');
    }
  }, [repoLoading, hasActiveRepo, navigate]);

  const handleEditContent = async (filename: string) => {
    const data = await loadContent(filename);
    if (data) {
      setCurrentFile(filename);
      setCurrentData(data);
      setState('editing');
    }
  };

  const handleSaveContent = async (data: ContentData): Promise<boolean> => {
    if (!currentFile) return false;

    const success = await saveContent(currentFile, data);
    if (success) {
      setCurrentData(data);
      // Auto-return to dashboard after successful save
      setTimeout(() => {
        setState('dashboard');
        setCurrentFile(null);
        setCurrentData(null);
      }, 1000);
    }
    return success;
  };

  const handleCancelEdit = () => {
    setState('dashboard');
    setCurrentFile(null);
    setCurrentData(null);
    clearError();
  };

  const handleGenerateHtml = async () => {
    await generateHtml();
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <>
      {/* User Info Bar */}
      {user && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl}
                alt={user.name || user.login}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {user.name || user.login}
                </p>
                <p className="text-xs text-gray-500">@{user.login}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <Layout
        onGenerateHtml={state === 'dashboard' ? handleGenerateHtml : undefined}
        isGenerating={loading && state === 'dashboard'}
      >
        {/* Error Toast */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-4 text-white hover:text-red-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {state === 'dashboard' && (
          <Dashboard onEditContent={handleEditContent} />
        )}

        {state === 'editing' && currentFile && currentData && (
          <div className="h-[calc(100vh-12rem)]">
            <FormRouter
              filename={currentFile}
              data={currentData}
              onSave={handleSaveContent}
              onCancel={handleCancelEdit}
              isLoading={loading}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="text-gray-900">
                {state === 'editing' ? 'Saving changes...' : 'Loading...'}
              </span>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

export default DashboardWrapper;
