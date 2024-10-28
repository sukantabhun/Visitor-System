import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import VisitorPass from './components/VisitorPass';
import LoginForm from './components/LoginForm';
import CreateUserForm from './components/CreateUserForm';
import AdminControlls from './components/AdminControlls';
import ProtectedRoute from './components/ProtectedRoutes';
import ProtectedRouteAdmin from './components/ProtectedRouteAdmin';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import { RoleProvider } from './context/RoleContext'; // Import RoleProvider

function App() {
  return (
    <Router>
      <RoleProvider>
        <Routes>
          <Route exact path="/" element={<ProtectedRoute element={<Home />} />} />
          <Route exact path="/create-pass" element={<ProtectedRoute element={<VisitorPass />} />} />
          <Route exact path="/login" element={<LoginForm />} /> {/* This should remain unprotected */}
          <Route exact path="/create-user" element={<ProtectedRouteAdmin element={<CreateUserForm />} />} />
          <Route exact path="/admin" element={<ProtectedRouteAdmin element={<AdminControlls />} />} />
          <Route exact path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RoleProvider>
    </Router>
  );
}

export default App;
