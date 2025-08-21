import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FallbackRoute = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting to home page...</p>
    </div>
  );
};

export default FallbackRoute;