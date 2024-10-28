import React, { useContext, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext'; // Adjust the path as necessary
import {jwtDecode} from 'jwt-decode'; // Fix the import statement

const LoginForm = () => {
  const { setRole } = useContext(RoleContext);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const onChangeUsername = (event) => {
    setName(event.target.value);
  };

  const onChangePassword = (event) => {
    setPassword(event.target.value);
  };

  const onSubmitSuccess = (jwtToken) => {
    Cookies.set('jwt_token', jwtToken, { expires: 30, path: '/' });

    const decodedToken = jwtDecode(jwtToken);
    const userRole = decodedToken.role;
    setRole(userRole);
    navigate('/');
  };

  const onSubmitFailure = (error) => {
    setShowSubmitError(true);
    setErrorMsg(error || 'Invalid credentials. Please try again.'); // Provide a fallback message
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const userDetails = { name, password };
    const url = 'http://localhost:5000/login';
    const options = {
      method: 'POST',
      body: JSON.stringify(userDetails),
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (response.ok) {
        onSubmitSuccess(data.token);
      } else {
        console.error('Error:', data); // Debugging: Log the error response
        onSubmitFailure(data.error_msg);
      }
    } catch (error) {
      console.error('Network Error:', error); // Debugging: Log network errors
      onSubmitFailure('Network error. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <form onSubmit={submitForm} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              USERNAME
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={name}
              onChange={onChangeUsername}
              placeholder="Username"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={onChangePassword}
              placeholder="Password"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login
            </button>
          </div>
          {showSubmitError && (
            <p className="text-red-500 text-xs italic mt-4">*{errorMsg}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;