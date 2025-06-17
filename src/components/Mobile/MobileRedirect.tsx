import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { shouldRedirectToMobile, getMobilePath } from '../../utils/mobileDetection';

interface MobileRedirectProps {
  enabled?: boolean;
}

/**
 * Component that handles automatic redirection to mobile routes when on a mobile device
 */
const MobileRedirect: React.FC<MobileRedirectProps> = ({ enabled = true }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip redirection if disabled
    if (!enabled) return;

    // Check if we should redirect to mobile
    if (shouldRedirectToMobile(location.pathname)) {
      const mobilePath = getMobilePath(location.pathname);
      navigate(mobilePath, { replace: true });
    }
  }, [location.pathname, navigate, enabled]);

  // This component doesn't render anything
  return null;
};

export default MobileRedirect; 