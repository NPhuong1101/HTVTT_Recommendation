import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          TravelVN
        </Link>

        <div className="search-bar-container">
          <SearchBar />
        </div>

      </div>
      
      <div className="nav-links">
        {isLoggedIn ? (
          <>
            <span className="user-greeting">Xin chào, {user?.name}</span>
            <button 
              onClick={() => navigate('/profile')} 
              className="profile-btn"
            >
              Hồ sơ
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Đăng xuất
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} className="login-btn">
            Đăng nhập
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;