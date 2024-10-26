import React, { useEffect, useState, useCallback } from 'react';
import Header from '../Header';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { QRCodeCanvas } from 'qrcode.react';

const Home = () => {
  const navigate = useNavigate();
  const jwtToken = Cookies.get('jwt_token');
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [department, setDepartment] = useState('All'); // Default to 'All'
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keys, setKeys] = useState([]);

  const departments = ['All', 'IT', 'Mechanical', 'Civil', 'Management']; // Predefined departments

  useEffect(() => {
    if (!jwtToken) navigate('/login');
  }, [jwtToken, navigate]);

  const fetchVisitors = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await axios.get(
        `http://localhost:5000/visitors?date=${formattedDate}`,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      const visitorData = response.data.map(({ _id, __v, ...rest }) => rest); 
      setVisitors(visitorData);
      setFilteredVisitors(visitorData);
      if (visitorData.length > 0) {
        setKeys(Object.keys(visitorData[0]));
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setError('Failed to fetch visitor data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  useEffect(() => {
    fetchVisitors(selectedDate);
  }, [selectedDate, fetchVisitors]);

  useEffect(() => {
    const filterResults = visitors.filter(
      (visitor) =>
        (department === 'All' || visitor.department.toLowerCase().includes(department.toLowerCase())) &&
        visitor.name.toLowerCase().includes(name.toLowerCase())
    );
    setFilteredVisitors(filterResults);
  }, [department, name, visitors]);

  return (
    <div className="w-full h-screen flex flex-col">
      <Header />
      <div className="p-4 flex flex-col items-center bg-gray-100 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Visitor MIS Report</h1>

        <div className="flex space-x-4 mb-4">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="p-2 border rounded"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="p-2 border rounded"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border rounded"
          />
        </div>

        <div className="w-full max-w-4xl">
          {loading ? (
            <p className="text-center text-lg">Loading visitors...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <table className="table-auto w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-center">#</th>
                  <th className="p-2 text-center">Photo</th>
                  {keys
                    .filter((key) => key !== 'photo') // Exclude 'photo' since it's already handled
                    .map((key) => (
                      <th key={key} className="p-2 text-center capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                  <th className="p-2 text-center">QR Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.length > 0 ? (
                  filteredVisitors.map((visitor, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 text-center">{index + 1}</td>
                      <td className="p-2 text-center">
                        <img
                          src={visitor.photo}
                          alt="Visitor"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </td>
                      {keys
                        .filter((key) => key !== 'photo')
                        .map((key) => (
                          <td key={key} className="p-2 text-center">
                            {key === 'createdAt'
                              ? new Date(visitor[key]).toLocaleDateString()
                              : visitor[key]}
                          </td>
                        ))}
                      <td className="p-2 text-center">
                        <QRCodeCanvas
                          value={visitor.qrData || 'No QR Data'}
                          size={64}
                          className="mx-auto"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={keys.length + 2} className="text-center p-4">
                      No visitors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
