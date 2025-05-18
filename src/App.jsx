import { Routes, Route, Navigate } from 'react-router-dom';
import Destination from './pages/Destination';
import MainPage from './pages/MainPage';
import UserProfile from './pages/UserProfile';
import AuthForm from './components/AuthForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/destination/:id" element={<Destination />} />
      <Route 
        path="/profile" 
        element={
          localStorage.getItem('user') ? 
            <UserProfile /> : 
            <Navigate to="/login" />
        } 
      />
      <Route path="/login" element={<AuthForm />} />
    </Routes>
  );
}

export default App;