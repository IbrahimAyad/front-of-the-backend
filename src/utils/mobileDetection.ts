/**
 * Utility functions for mobile device detection and redirection
 */

// Check if the current device is a mobile device
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Regular expression for mobile device detection
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
};

// Check if the current path is a mobile path
export const isMobilePath = (path: string): boolean => {
  return path.startsWith('/mobile');
};

// Check if we should redirect to mobile
export const shouldRedirectToMobile = (path: string): boolean => {
  // Don't redirect if already on a mobile path
  if (isMobilePath(path)) {
    return false;
  }
  
  // Don't redirect for certain paths (like auth paths)
  const excludedPaths = ['/login', '/register', '/reset-password'];
  if (excludedPaths.some(excludedPath => path.startsWith(excludedPath))) {
    return false;
  }
  
  // Redirect if on a mobile device
  return isMobileDevice();
};

// Get the mobile equivalent of a desktop path
export const getMobilePath = (path: string): string => {
  // By default, redirect to the main mobile dashboard
  return '/mobile';
  
  // For future: could map specific paths to specific mobile routes
  // Example:
  // if (path.startsWith('/orders')) {
  //   return '/mobile/orders';
  // }
};

// Get the desktop equivalent of a mobile path
export const getDesktopPath = (path: string): string => {
  // By default, redirect to the main dashboard
  return '/dashboard';
  
  // For future: could map specific mobile paths to specific desktop routes
  // Example:
  // if (path === '/mobile/orders') {
  //   return '/orders';
  // }
}; 