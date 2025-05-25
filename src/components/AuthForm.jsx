import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/AuthForm.css';

const AuthForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [travelHistory, setTravelHistory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchPlaces = async (query) => {
    if (query.length < 2) return setSearchResults([]);
    try {
      const res = await axios.get(`/api/search-places?query=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleAddTravelPlace = (place) => {
    if (!travelHistory.some(item => item.id === place.id)) {
      setTravelHistory([...travelHistory, {
        id: place.id,
        name: place.name,
        startDate: '',
        endDate: ''
      }]);
    }
    setSearchInput('');
    setSearchResults([]);
  };

  const handleRemovePlace = (id) => {
    setTravelHistory(travelHistory.filter(place => place.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      try {
        const res = await axios.post('/api/login', {
          email: formData.email,
          password: formData.password
        });

        if (res.data.success) {
          // Đảm bảo lưu đúng cấu trúc
          localStorage.setItem('user', JSON.stringify({
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email
          }));
          navigate('/');
        }
      } catch (err) {
        console.error('Login failed:', err);
      }
    } else {
      if (signupStep === 1) {
        if (formData.password !== formData.confirmPassword) {
          alert('Mật khẩu không khớp!');
          return;
        }
        setSignupStep(2);
      } else {
        // Validate travel dates
        for (let place of travelHistory) {
          if (!place.startDate || !place.endDate) {
            alert(`Vui lòng nhập thời gian du lịch cho: ${place.name}`);
            return;
          }
        }

        try {
          const res = await axios.post('/api/register', {
            ...formData,
            travelHistory
          });
          
          console.log("Register response:", res.data); // Thêm dòng này để debug
          
          // Đảm bảo res.data có chứa id người dùng
          localStorage.setItem('user', JSON.stringify({
            id: res.data.user_id || res.data.id, // <-- Kiểm tra cả 2 trường hợp
            name: formData.name,
            email: formData.email
          }));
          navigate('/profile');
        } catch (err) {
          alert('Đăng ký thất bại. Vui lòng thử lại.');
        }
      }
    }
  };

  return (
    <div className="auth-bg">
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Đăng nhập' : (signupStep === 1 ? 'Đăng ký' : 'Sở thích du lịch')}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && signupStep === 1 && (
            <>
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group password-field">
                <label>Mật khẩu</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength="6"
                />
                <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="form-group password-field">
                <label>Xác nhận mật khẩu</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="eye-icon">
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </>
          )}

          {!isLogin && signupStep === 2 && (
            <div className="travel-history-step">
              <div className="form-group">
                <label>Bạn đã từng đi du lịch ở đâu?</label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    handleSearchPlaces(e.target.value);
                  }}
                  placeholder="Nhập tên địa điểm..."
                />

                {searchResults.length > 0 && (
                  <ul className="search-results">
                    {searchResults.map(place => (
                      <li key={place.id} onClick={() => handleAddTravelPlace(place)}>
                        {place.name} - {place.location}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="selected-places">
                <h4>Địa điểm đã chọn:</h4>
                {travelHistory.length === 0 ? (
                  <p>Chưa có địa điểm nào</p>
                ) : (
                  <ul>
                    {travelHistory.map((place, index) => (
                      <li key={place.id}>
                        <div><strong>{place.name}</strong></div>
                        <div className="date-inputs">
                          <label>Từ:</label>
                          <input
                            type="date"
                            value={place.startDate}
                            onChange={(e) => {
                              const updated = [...travelHistory];
                              updated[index].startDate = e.target.value;
                              setTravelHistory(updated);
                            }}
                            required
                          />
                          <label>Đến:</label>
                          <input
                            type="date"
                            value={place.endDate}
                            onChange={(e) => {
                              const updated = [...travelHistory];
                              updated[index].endDate = e.target.value;
                              setTravelHistory(updated);
                            }}
                            required
                          />
                        </div>
                        <button type="button" onClick={() => handleRemovePlace(place.id)}>Xóa</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {isLogin && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group password-field">
                <label>Mật khẩu</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </>
          )}

          <button type="submit" className="submit-btn">
            {isLogin ? 'Đăng nhập' : (signupStep === 1 ? 'Tiếp tục' : 'Hoàn tất đăng ký')}
          </button>

          <p className="toggle-auth">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <span onClick={() => {
              setIsLogin(!isLogin);
              setSignupStep(1);
            }}>
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </span>
          </p>
        </form>
      </div>
    </div>
    </div>
  );
};

export default AuthForm;

