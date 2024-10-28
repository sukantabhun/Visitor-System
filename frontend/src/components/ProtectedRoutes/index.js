import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ element, ...rest }) => {
  const token = Cookies.get('jwt_token');

  // Check if token exists
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Return the element if the user is authenticated
  return element;
};

export default ProtectedRoute;
