import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/AuthForm.css';

const VIETNAM_POPULAR_PLACES = [
  { id: 1, name: "Hà Nội", location: "Miền Bắc" },
  { id: 2, name: "Hà Giang", location: "Miền Bắc" },
  { id: 3, name: "Cao Bằng", location: "Miền Bắc" },
  { id: 4, name: "Bắc Kạn", location: "Miền Bắc" },
  { id: 5, name: "Tuyên Quang", location: "Miền Bắc" },
  { id: 6, name: "Lào Cai", location: "Miền Bắc" },
  { id: 7, name: "Điện Biên", location: "Miền Bắc" },
  { id: 8, name: "Lai Châu", location: "Miền Bắc" },
  { id: 9, name: "Sơn La", location: "Miền Bắc" },
  { id: 10, name: "Yên Bái", location: "Miền Bắc" },
  { id: 11, name: "Hoà Bình", location: "Miền Bắc" },
  { id: 12, name: "Thái Nguyên", location: "Miền Bắc" },
  { id: 13, name: "Lạng Sơn", location: "Miền Bắc" },
  { id: 14, name: "Quảng Ninh", location: "Miền Bắc" },
  { id: 15, name: "Bắc Giang", location: "Miền Bắc" },
  { id: 16, name: "Phú Thọ", location: "Miền Bắc" },
  { id: 17, name: "Vĩnh Phúc", location: "Miền Bắc" },
  { id: 18, name: "Bắc Ninh", location: "Miền Bắc" },
  { id: 19, name: "Hải Dương", location: "Miền Bắc" },
  { id: 20, name: "Hải Phòng", location: "Miền Bắc" },
  { id: 21, name: "Hưng Yên", location: "Miền Bắc" },
  { id: 22, name: "Thái Bình", location: "Miền Bắc" },
  { id: 23, name: "Nam Định", location: "Miền Bắc" },
  { id: 24, name: "Ninh Bình", location: "Miền Bắc" },
  { id: 25, name: "Thanh Hóa", location: "Miền Trung" },
  { id: 26, name: "Nghệ An", location: "Miền Trung" },
  { id: 27, name: "Hà Tĩnh", location: "Miền Trung" },
  { id: 28, name: "Quảng Bình", location: "Miền Trung" },
  { id: 29, name: "Quảng Trị", location: "Miền Trung" },
  { id: 30, name: "Thừa Thiên Huế", location: "Miền Trung" },
  { id: 31, name: "Đà Nẵng", location: "Miền Trung" },
  { id: 32, name: "Quảng Nam", location: "Miền Trung" },
  { id: 33, name: "Quảng Ngãi", location: "Miền Trung" },
  { id: 34, name: "Bình Định", location: "Miền Trung" },
  { id: 35, name: "Phú Yên", location: "Miền Trung" },
  { id: 36, name: "Khánh Hòa", location: "Miền Trung" },
  { id: 37, name: "Ninh Thuận", location: "Miền Trung" },
  { id: 38, name: "Bình Thuận", location: "Miền Trung" },
  { id: 39, name: "Kon Tum", location: "Miền Trung" },
  { id: 40, name: "Gia Lai", location: "Miền Trung" },
  { id: 41, name: "Đắk Lắk", location: "Miền Trung" },
  { id: 42, name: "Đắk Nông", location: "Miền Trung" },
  { id: 43, name: "Lâm Đồng", location: "Miền Trung" },
  { id: 44, name: "TP. Hồ Chí Minh", location: "Miền Nam" },
  { id: 45, name: "Bình Dương", location: "Miền Nam" },
  { id: 46, name: "Bình Phước", location: "Miền Nam" },
  { id: 47, name: "Tây Ninh", location: "Miền Nam" },
  { id: 48, name: "Bà Rịa - Vũng Tàu", location: "Miền Nam" },
  { id: 49, name: "Long An", location: "Miền Nam" },
  { id: 50, name: "Đồng Nai", location: "Miền Nam" },
  { id: 51, name: "Tiền Giang", location: "Miền Nam" },
  { id: 52, name: "Bến Tre", location: "Miền Nam" },
  { id: 53, name: "Trà Vinh", location: "Miền Nam" },
  { id: 54, name: "Vĩnh Long", location: "Miền Nam" },
  { id: 55, name: "Đồng Tháp", location: "Miền Nam" },
  { id: 56, name: "An Giang", location: "Miền Nam" },
  { id: 57, name: "Hậu Giang", location: "Miền Nam" },
  { id: 58, name: "Kiên Giang", location: "Miền Nam" },
  { id: 59, name: "Sóc Trăng", location: "Miền Nam" },
  { id: 60, name: "Bạc Liêu", location: "Miền Nam" },
  { id: 61, name: "Cà Mau", location: "Miền Nam" },
  { id: 62, name: "Cần Thơ", location: "Miền Nam" },
  { id: 63, name: "Hậu Giang", location: "Miền Nam" }
];



const AuthForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

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
      <div className="auth-overlay">
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
                  
                  <div className="search-wrapper">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        handleSearchPlaces(e.target.value);
                      }}
                      placeholder="Nhập tên địa điểm..."
                      className="search-input"
                    />
                    <FaSearch className="search-icon" />
                  </div>
                  
                  {/* Gợi ý địa điểm phổ biến */}
                  {searchInput.length < 2 && (
                    <div className="popular-places-container">
                      <div className="suggestion-header">
                        <p className="suggestion-title">Địa điểm phổ biến tại Việt Nam</p>
                        {!showAllSuggestions ? (
                          <button 
                            className="show-more-btn"
                            type="button" // Thêm type="button" để ngăn submit form
                            onClick={() => setShowAllSuggestions(true)}
                          >
                            Xem thêm
                          </button>
                        ) : (
                          <button 
                            className="show-less-btn"
                            type="button"
                            onClick={() => setShowAllSuggestions(false)}
                          >
                            Thu gọn
                          </button>
                        )}
                      </div>
                      
                      <div className="suggestion-tags">
                        {(showAllSuggestions ? VIETNAM_POPULAR_PLACES : VIETNAM_POPULAR_PLACES.slice(0, 8)).map(place => (
                          <button
                            key={place.id}
                            className="place-tag"
                            onClick={() => {
                              setSearchInput(place.name);
                              handleSearchPlaces(place.name);
                            }}
                          >
                            {place.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="search-results-container">
                      {searchResults.map(place => (
                        <div 
                          key={place.id} 
                          className="result-item"
                          onClick={() => handleAddTravelPlace(place)}
                        >
                          <div className="place-icon">📍</div>
                          <div>
                            <div className="place-name">{place.name}</div>
                            <div className="place-location">{place.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="selected-places-container">
                  <h4>Địa điểm đã chọn:</h4>
                  {travelHistory.length === 0 ? (
                    <div className="empty-state">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" 
                        alt="No places"
                        className="empty-icon"
                      />
                      <p>Chưa có địa điểm nào được thêm</p>
                      <p className="hint-text">Hãy tìm kiếm hoặc chọn từ gợi ý bên trên</p>
                    </div>
                  ) : (
                    <div className="places-list">
                      {travelHistory.map((place, index) => (
                        <div key={place.id} className="place-card">
                          <div className="place-header">
                            <div className="place-info">
                              <span className="place-icon">📍</span>
                              <span className="place-name">{place.name}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemovePlace(place.id)}
                              className="remove-btn"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          
                          <div className="date-inputs">
                            <div className="date-group">
                              <label>Từ ngày:</label>
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
                            </div>
                            
                            <div className="date-group">
                              <label>Đến ngày:</label>
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
                          </div>
                        </div>
                      ))}
                    </div>
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
    </div>
  );
};

export default AuthForm;

