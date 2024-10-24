import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import VisitorPass from './components/VisitorPass';
import LoginForm from './components/LoginForm';
import CreateUserForm from './components/CreateUserForm';
import { RoleProvider } from './context/RoleContext'; // Import RoleProvider

function App() {
  return (
    <Router>
      <RoleProvider>
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/create-pass" element={<VisitorPass />} />
          <Route exact path="/login" element={<LoginForm />} />
          <Route exact path="/create-user" element={<CreateUserForm />} />
        </Routes>
      </RoleProvider>
    </Router>
  );
}

export default App;
