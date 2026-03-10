import { useRouteError, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

const RouteErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 max-w-2xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          {/* Icon */}
          <motion.div
            className="flex justify-center mb-6"
            variants={iconVariants}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <AlertTriangle className="w-20 h-20 text-red-500 relative z-10" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-500 via-orange-500 to-red-600 mb-4">
              Oops!
            </h1>
            <h2 className="text-2xl md:text-3xl text-slate-100 font-semibold mb-4">
              Page Not Found
            </h2>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-slate-300 text-lg mb-8 leading-relaxed"
            variants={itemVariants}
          >
            The page you're looking for doesn't exist or encountered an error.
          </motion.p>

          {/* Error Details (Development) */}
          {import.meta.env.MODE === 'development' && error && (
            <motion.div
              className="bg-slate-950/80 border border-red-500/30 rounded-lg p-6 mb-8 text-left backdrop-blur-sm"
              variants={itemVariants}
            >
              <h3 className="text-red-400 font-mono font-semibold text-sm mb-2">
                Error Details:
              </h3>
              <p className="text-slate-300 font-mono text-xs wrap-break-word max-h-32 overflow-auto">
                {error?.message || error?.statusText || 'Unknown error'}
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => window.location.reload()}
              className="group px-8 py-4 bg-linear-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-red-500/30"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Retry
            </motion.button>

            <motion.button
              onClick={() => navigate('/instructor/dashboard')}
              className="group px-8 py-4 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg border border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-5 h-5" />
              Go Home
            </motion.button>
          </motion.div>

          {/* Support message */}
          <motion.div
            className="mt-12 pt-8 border-t border-slate-700"
            variants={itemVariants}
          >
            <p className="text-slate-400 text-sm">
              If this issue persists, please contact support.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default RouteErrorPage;
