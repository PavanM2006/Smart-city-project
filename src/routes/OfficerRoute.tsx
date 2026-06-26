import React from 'react';
import { Navigate } from 'react-router-dom';

interface OfficerRouteProps {
  children: React.ReactNode;
}

const OfficerRoute: React.FC<OfficerRouteProps> = ({ children }) => {
  const token = localStorage.getItem('smartcity_token');
  const userString = localStorage.getItem('smartcity_user');

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    if (user.role !== 'department_officer') {
      // Access forbidden for non-officers
      return <Navigate to="/dashboard" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default OfficerRoute;
