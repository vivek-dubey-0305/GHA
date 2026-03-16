import { Suspense } from 'react';
import RouteErrorBoundary from './RouteErrorBoundary';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Wrapper component that combines error boundary + suspense
const RouteWrapper = ({ children }) => (
  <RouteErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </RouteErrorBoundary>
);

export default RouteWrapper;
