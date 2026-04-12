import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, selectInitializingAuth, selectUser } from './redux/slices/auth.slice';
import GHALoader from './components/GHALoader';
import router from './router/router';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler - catches unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  event.preventDefault();
});

const App = () => {
  const dispatch = useDispatch();
  const initializingAuth = useSelector(selectInitializingAuth);
  const user = useSelector(selectUser);

  useEffect(() => {
    // Initialize authentication state on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  // Show GHA loader while initializing
  if (initializingAuth) {
    return <GHALoader />;
  }

  return (
    <div className="bg-[#080808] text-[#f5f5f0] overflow-x-hidden">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </div>
  );
};

export default App;