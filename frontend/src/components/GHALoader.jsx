import { useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

const GHALoader = () => {
  useEffect(() => {
    // Prevent body scroll while loader is visible
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.8,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  const barVariants = {
    hidden: { width: 0 },
    visible: {
      width: '100%',
      transition: {
        duration: 1.8,
        delay: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-6"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* SVG Thread Animation */}
      <svg
        className="w-80 h-40 overflow-visible"
        viewBox="0 0 280 140"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* GHA - Letter G */}
        <motion.path
          d="M 20 30 Q 10 30 10 50 L 10 90 Q 10 110 30 110 L 50 110 Q 70 110 70 90 L 70 80 L 40 80 L 40 90"
          stroke="#f5c518"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="600"
          initial={{ strokeDashoffset: 600 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.77, 0, 0.175, 1] }}
          filter="drop-shadow(0 0 3px rgba(245, 197, 24, 0.53))"
        />

        {/* GHA - Letter H */}
        <motion.path
          d="M 100 30 L 100 110 M 100 70 L 140 70 M 140 30 L 140 110"
          stroke="#f5f5f0"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="500"
          initial={{ strokeDashoffset: 500 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.77, 0, 0.175, 1] }}
        />

        {/* GHA - Letter A */}
        <motion.path
          d="M 160 110 L 190 30 L 220 110 M 170 75 L 210 75"
          stroke="#f5f5f0"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="500"
          initial={{ strokeDashoffset: 500 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease: [0.77, 0, 0.175, 1] }}
        />
      </svg>

      {/* Text Container */}
      <motion.div
        className="text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main Label */}
        <motion.div
          variants={textVariants}
          className="font-display text-5xl tracking-widest text-white"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.25em' }}
        >
          GHA
        </motion.div>

        {/* SubLabel */}
        <motion.div
          variants={textVariants}
          className="font-head text-xs tracking-widest text-yellow-500 uppercase mt-2"
          style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '0.5em' }}
        >
          Loading
        </motion.div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div className="w-52 h-0.5 bg-gray-800 rounded-full overflow-hidden mt-4">
        <motion.div
          className="h-full bg-yellow-500"
          variants={barVariants}
          initial="hidden"
          animate="visible"
        />
      </motion.div>
    </motion.div>
  );
};

export default GHALoader;
