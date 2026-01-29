import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLoader from './AppLoader';

export default function RouteLoader({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {loading && <AppLoader />}
      {children}
    </>
  );
}
