import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateUserForm = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator'); // Default role is 'operator'
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const onChangeUsername = (event) => setName(event.target.value);
  const onChangePassword = (event) => setPassword(event.target.value);
  const onChangeRole = (event) => setRole(event.target.value);

  const onSubmitSuccess = (message) => {
    alert(message); // Show success alert
    navigate('/'); // Redirect to home
  };

  const onSubmitFailure = (error) => {
    setShowSubmitError(true);
    setErrorMsg(error);
  };

  const validateForm = () => {
    if (!name || !password) {
      onSubmitFailure('Username and Password are required.');
      return false;
    }
    return true;
  };

  const checkUserExists = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/users/${username}`, {
        method: 'GET',
      });
      return response.ok; // If user exists, return true
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const userExists = await checkUserExists(name);
    if (userExists) {
      onSubmitFailure('Username already exists. Please try a different one.');
      return;
    }

    const userDetails = { name, password, role };

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDetails),
      });

      const data = await response.json();

      if (response.ok) {
        onSubmitSuccess('New user created successfully!');
      } else {
        onSubmitFailure(data.error);
      }
    } catch (error) {
      onSubmitFailure('Failed to create user. Please try again.');
    }
  };

  const renderPasswordField = () => (
    <>
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
    </>
  );

  const renderUsernameField = () => (
    <>
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
    </>
  );

  const renderRoleField = () => (
    <div className="mt-4">
      <span className="text-gray-700 text-sm font-bold mb-2">Role:</span>
      <div className="flex items-center mt-2">
        <input
          type="radio"
          id="admin"
          name="role"
          value="admin"
          checked={role === 'admin'}
          onChange={onChangeRole}
          className="mr-2"
        />
        <label htmlFor="admin" className="mr-4">Admin</label>

        <input
          type="radio"
          id="operator"
          name="role"
          value="operator"
          checked={role === 'operator'}
          onChange={onChangeRole}
          className="mr-2"
        />
        <label htmlFor="operator">Operator</label>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <form onSubmit={submitForm} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">{renderUsernameField()}</div>
          <div className="mb-6">{renderPasswordField()}</div>
          {renderRoleField()}
          <div className="flex items-center justify-between mt-4">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Create New User
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

export default CreateUserForm;