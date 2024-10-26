import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AdminControls = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editedUser, setEditedUser] = useState({}); // For tracking changes
  const navigate = useNavigate();  
  const jwtToken = Cookies.get('jwt_token');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [jwtToken]);

  const handleEditChange = (e, userId) => {
    setEditedUser({
      ...editedUser,
      [userId]: {
        ...users.find(user => user._id === userId),
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleUpdateUser = async (userId) => {
    try {
      const userUpdate = editedUser[userId] || {};
      // Only include password in the update if it's been changed
      const payload = {
        name: userUpdate.name,
        role: userUpdate.role,
        ...(userUpdate.password ? { password: userUpdate.password } : {}),
      };

      await axios.put(`http://localhost:5000/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      
      setUsers(users.map(user => (user._id === userId ? { ...user, ...userUpdate } : user)));
      alert('User updated successfully');
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        await axios.delete(`http://localhost:5000/users/${userId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setUsers(users.filter(user => user._id !== userId));
        alert('User removed successfully');
      } catch (err) {
        setError('Failed to remove user');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Controls</h1>
      <button onClick={() => navigate('/')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 mt-4">
        Home
      </button>
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && users.length === 0 && <p>No users found.</p>}

      <table className="table-auto w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-center">Username</th>
            <th className="p-2 text-center">Password</th>
            <th className="p-2 text-center">Role</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-b">
              <td className="p-2 text-center">
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name}
                  onChange={(e) => handleEditChange(e, user._id)}
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  onChange={(e) => handleEditChange(e, user._id)}
                />
              </td>
              <td className="p-2 text-center">
                <select
                  name="role"
                  defaultValue={user.role}
                  onChange={(e) => handleEditChange(e, user._id)}
                >
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                </select>
              </td>
              <td className="p-2 text-center">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => handleUpdateUser(user._id)}
                >
                  Update
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded ml-2"
                  onClick={() => handleRemoveUser(user._id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminControls;
