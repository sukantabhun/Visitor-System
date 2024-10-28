import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AdminControls = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editedUser, setEditedUser] = useState({});
  const navigate = useNavigate();
  const jwtToken = Cookies.get('jwt_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, departmentResponse] = await Promise.all([
          axios.get('http://localhost:5000/users', {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }),
          axios.get('http://localhost:5000/departments', {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }),
        ]);
        setUsers(userResponse.data);
        setDepartments(departmentResponse.data);
      } catch (err) {
        setError('Failed to fetch users or departments');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jwtToken]);

  const handleEditChange = (e, userId) => {
    setEditedUser({
      ...editedUser,
      [userId]: {
        ...users.find((user) => user._id === userId),
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleUpdateUser = async (userId) => {
    try {
      const userUpdate = editedUser[userId] || {};
      const payload = {
        name: userUpdate.name,
        role: userUpdate.role,
        ...(userUpdate.password ? { password: userUpdate.password } : {}),
      };
      await axios.put(`http://localhost:5000/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setUsers(users.map((user) => (user._id === userId ? { ...user, ...userUpdate } : user)));
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
        setUsers(users.filter((user) => user._id !== userId));
        alert('User removed successfully');
      } catch (err) {
        setError('Failed to remove user');
      }
    }
  };

  const handleOpenDepartmentModal = () => {
    setShowDepartmentModal(true);
  };

  const handleCloseDepartmentModal = () => {
    setShowDepartmentModal(false);
    setNewDepartment('');
  };

  const handleAddDepartment = async () => {
    if (newDepartment.trim() === '') return alert('Department name is required.');
    try {
      const response = await axios.post(
        'http://localhost:5000/departments',
        { name: newDepartment },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setDepartments([...departments, response.data]);
      alert('Department added successfully');
      handleCloseDepartmentModal();
    } catch (err) {
      setError('Failed to add department');
    }
  };

  const handleRemoveDepartment = async (departmentId) => {
    if (window.confirm('Are you sure you want to remove this department?')) {
      try {
        await axios.delete(`http://localhost:5000/departments/${departmentId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setDepartments(departments.filter((department) => department._id !== departmentId));
        alert('Department removed successfully');
      } catch (err) {
        setError('Failed to remove department');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Controls</h1>
      <button onClick={() => navigate('/')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 mt-4">
        Home
      </button>
      <button onClick={handleOpenDepartmentModal} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 mt-4 ml-4">
        Add Department
      </button>

      {loading && <p>Loading users and departments...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && users.length === 0 && <p>No users found.</p>}

      <table className="table-auto w-full bg-white shadow-md rounded-lg mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-center">Username</th>
            <th className="p-2 text-center">Password</th>
            <th className="p-2 text-center">Role</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
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
                <select name="role" defaultValue={user.role} onChange={(e) => handleEditChange(e, user._id)}>
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

      <h2 className="text-2xl font-bold mt-8">Departments</h2>
      <ul className="list-disc pl-6 mt-4">
        {departments.map((department) => (
          <li key={department._id} className="text-lg flex justify-between items-center mb-4">
            {department.name}
            <button
              onClick={() => handleRemoveDepartment(department._id)}
              className="bg-red-500 text-white px-2 py-1 rounded ml-4"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {showDepartmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">Add New Department</h2>
            <input
              type="text"
              placeholder="Department Name"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            />
            <button onClick={handleAddDepartment} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 mr-2">
              Add
            </button>
            <button onClick={handleCloseDepartmentModal} className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControls;
