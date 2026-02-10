import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, selectInitializingAuth, selectIsAuthenticated } from './redux/slices/auth.slice';
import { ToastProvider } from './components/ui';
import router from './router/router';

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
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
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
};

export default App;