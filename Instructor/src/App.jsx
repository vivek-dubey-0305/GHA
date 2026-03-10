import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, selectInitializingAuth, selectIsAuthenticated } from './redux/slices/auth.slice';
import router from './router/router';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler - catches unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  event.preventDefault();
});

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-black via-gray-900 to-gray-800">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <p className="text-white text-lg">Initializing...</p>
    </div>
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const initializingAuth = useSelector(selectInitializingAuth);
  console.log("Initializing Auth : ", initializingAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  console.log("Isauthneticated, ", isAuthenticated)

  useEffect(() => {
    // Initialize authentication state on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  // Show loading screen while initializing
  if (initializingAuth) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default App;