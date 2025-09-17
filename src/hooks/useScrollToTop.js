// src/hooks/useScrollToTop.js - Hook for automatic scroll to top
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that automatically scrolls to top when route changes
 * @param {Object} options - Configuration options
 * @param {boolean} options.smooth - Use smooth scrolling (default: true)
 * @param {number} options.delay - Delay before scrolling in ms (default: 0)
 */
const useScrollToTop = (options = {}) => {
  const location = useLocation();
  const { smooth = true, delay = 0 } = options;

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'instant'
      });
    };

    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    } else {
      scrollToTop();
    }
  }, [location.pathname, location.search, smooth, delay]);
};

/**
 * Force scroll to top function
 * @param {boolean} smooth - Use smooth scrolling
 */
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'instant'
  });
};

export default useScrollToTop;