import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import TreeView from './pages/TreeView';
import AddEditPerson from './pages/AddEditPerson';
import PersonProfile from './pages/PersonProfile';
import Search from './pages/Search';
import Settings from './pages/Settings';
import RolesManagement from './pages/RolesManagement';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Private Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="trees/:treeId/persons/:personId" element={<PersonProfile />} />
                  <Route element={<AppLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="search" element={<Search />} />
                    <Route path="roles" element={<RolesManagement />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="trees/:treeId" element={<TreeView />} />
                    <Route path="trees/:treeId/persons/new" element={<AddEditPerson />} />
                    <Route path="trees/:treeId/persons/:personId/edit" element={<AddEditPerson />} />
                  </Route>
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
