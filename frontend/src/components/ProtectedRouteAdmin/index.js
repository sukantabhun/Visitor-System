import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import axios from 'axios';

const ProtectedRouteAdmin = ({ element, ...rest }) => {
  const [isAuthorized, setIsAuthorized] = useState(null); // Set initial state to null
  const token = Cookies.get('jwt_token');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/check-admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthorized(response.data.isAdmin);
      } catch {
        setIsAuthorized(false);
      }
    };

    checkAdminStatus();
  }, [token]);

  // If checking the authorization status
  if (isAuthorized === null) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" />; // Redirect to the Unauthorized component
  }

  // Return the element if the user is an admin
  return element;
};

export default ProtectedRouteAdmin;
