import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate(); // Get the navigate function

  const handleGoHome = () => {
    navigate('/'); // Navigate to the home page
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Unauthorized Access</h1>
      <p style={styles.message}>
        You do not have permission to view this page. Please contact an administrator if you believe this is an error.
      </p>
      <button onClick={handleGoHome} style={styles.button}>Go to Home</button> {/* Button to go home */}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '20px',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  message: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default Unauthorized;
