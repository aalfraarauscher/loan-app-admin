import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import Theme from './pages/Theme';
import Products from './pages/Products';
import Integrations from './pages/Integrations';
import Users from './pages/Users';
import Applications from './pages/Applications';
import Layout from './components/layout/Layout';

function App() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAdmin ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={isAdmin ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="organization" element={<Organization />} />
          <Route path="theme" element={<Theme />} />
          <Route path="products" element={<Products />} />
          <Route path="applications" element={<Applications />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
