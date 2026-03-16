import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * useNavigationHistory
 * Manages navigation history and provides back navigation
 * Clears history when on home page
 */
export const useNavigationHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const historyStackRef = useRef([]);

  useEffect(() => {
    const currentPath = location.pathname;

    // Clear history when on home page
    if (currentPath === "/") {
      historyStackRef.current = [];
      return;
    }

    // Add to history if not already the last item
    if (historyStackRef.current[historyStackRef.current.length - 1] !== currentPath) {
      historyStackRef.current.push(currentPath);
    }
  }, [location]);

  const goBack = () => {
    if (historyStackRef.current.length > 0) {
      historyStackRef.current.pop(); // Remove current page
      const previousPath = historyStackRef.current.pop(); // Get previous page
      if (previousPath) {
        navigate(previousPath);
      } else {
        navigate("/"); // Go home if no history
      }
    } else {
      navigate("/");
    }
  };

  const canGoBack = historyStackRef.current.length > 1;

  return { goBack, canGoBack };
};

export default useNavigationHistory;
