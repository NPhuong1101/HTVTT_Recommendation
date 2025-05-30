import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserProfile.css';
import PlaceCard from '../components/PlaceCard';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const UserProfile = () => {
  const navigate = useNavigate();

  const [travelHistory, setTravelHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [user, setUser] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);

  const [activeTab, setActiveTab] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Hàm kiểm tra trùng lặp ngày
  const isOverlapping = (start1, end1, start2, end2) => {
    try {
      const s1 = new Date(start1);
      const e1 = new Date(end1);
      const s2 = new Date(start2);
      const e2 = new Date(end2);

      // Kiểm tra ngày không hợp lệ
      if (isNaN(s1.getTime()) || isNaN(e1.getTime()) || isNaN(s2.getTime()) || isNaN(e2.getTime())) {
        throw new Error(`Ngày không hợp lệ: ${start1}, ${end1}, ${start2}, ${end2}`);
      }

      if (e1 < s1) throw new Error(`Ngày kết thúc phải sau ngày bắt đầu (${start1} - ${end1})`);
      if (e2 < s2) throw new Error(`Ngày kết thúc phải sau ngày bắt đầu (${start2} - ${end2})`);

      return s1 <= e2 && s2 <= e1;
    } catch (error) {
      console.error("Lỗi kiểm tra trùng lặp:", error);
      alert(error.message);
      return true;
    }
  };

  // Load dữ liệu user và lịch sử
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const loadUserHistory = async () => {
      try {
        const historyResponse = await axios.get(`/api/user-history/${parsedUser.id}`);
        const historyData = historyResponse.data.map(item => ({
          id: item.id,
          userId: item.userId,
          placeId: item.placeId,
          placeName: item.placeName,
          category: item.category || 'Không rõ',
          location: item.location || '',
          placeImg: item.placeImg || '',
          startDate: item.startDate,
          endDate: item.endDate,
          created_at: item.created_at
        }));

        setTravelHistory(historyData);
        historyData.length === 0 ? await fetchRandomPopularPlaces() : fetchRecommendations(historyData, parsedUser.id);
      } catch (error) {
        console.error("Error loading travel history:", error);
        await fetchRandomPopularPlaces();
      }
    };

    loadUserHistory();
  }, [navigate]);

  // Gợi ý địa điểm
  const fetchRecommendations = async (history, userId) => {
    if (history.length === 0 || !userId) return;

    try {
      const response = await axios.post('/api/suggest/user', { user_id: userId });
      setRecommendations(response.data?.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    }
  };

  // Tìm kiếm địa điểm
  const handleSearchPlace = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/search-places?query=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching places:", error);
    }
  };

  // Thêm địa điểm mới
  const handleAddPlace = async () => {
    const validPlaces = selectedPlaces.filter(p => p.placeId && p.startDate && p.endDate);
    if (validPlaces.length === 0) return;

    // Kiểm tra trùng lặp
    for (let i = 0; i < validPlaces.length; i++) {
      for (let j = i + 1; j < validPlaces.length; j++) {
        if (isOverlapping(validPlaces[i].startDate, validPlaces[i].endDate, validPlaces[j].startDate, validPlaces[j].endDate)) {
          alert(`Khoảng thời gian của địa điểm "${validPlaces[i].placeName}" bị trùng với "${validPlaces[j].placeName}".`);
          return;
        }
      }
    }

    for (const newPlace of validPlaces) {
      for (const existing of travelHistory) {
        if (isOverlapping(newPlace.startDate, newPlace.endDate, existing.startDate, existing.endDate)) {
          alert(`Địa điểm "${newPlace.placeName}" có khoảng thời gian trùng với "${existing.placeName}" từ ${existing.startDate} đến ${existing.endDate}.`);
          return;
        }
      }
    }

    try {
      const updatedHistory = [...travelHistory];
      
      for (const place of validPlaces) {
        const newRecord = {
          id: Date.now().toString() + Math.random(),
          userId: user.id,
          placeId: place.placeId,
          placeName: place.placeName,
          category: place.category || '',
          location: place.location || '',
          startDate: place.startDate,
          endDate: place.endDate,
          created_at: new Date().toISOString(),
          placeImg: ''
        };

        updatedHistory.push(newRecord);
        
        await axios.post('/api/save-travel-history', {
          userId: user.id,
          placeId: place.placeId,
          startDate: place.startDate,
          endDate: place.endDate
        });
      }

      setTravelHistory(updatedHistory);
      setSelectedPlaces([]);
      setActiveTab(null);
      await loadUserHistory(user.id);
    } catch (error) {
      console.error("Lỗi khi thêm địa điểm:", error);
      alert("Đã xảy ra lỗi khi thêm địa điểm.");
    }
  };

  // Xóa địa điểm
  const handleDeletePlace = async (id) => {
    try {
      const res = await fetch(`/api/delete-user-place/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        alert("Đã xóa địa điểm!");
        setTravelHistory(prev => prev.filter(item => item.id !== id));
      } else {
        alert(data.error || "Xóa thất bại!");
      }
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      alert("Lỗi kết nối khi xóa!");
    }
  };

  // Chọn địa điểm từ kết quả tìm kiếm
  const handlePlaceSelect = (place) => {
    if (selectedPlaces.some(p => p.placeId === place.id)) return;

    setSelectedPlaces(prev => [
      ...prev,
      {
        placeId: place.id,
        placeName: place.name,
        category: place.category,
        location: place.location,
        placeImg: place.image || '',
        startDate: '',
        endDate: ''
      }
    ]);

    setSearchResults([]);
    setSearchInput('');
  };

  // Xóa địa điểm đã chọn
  const handleRemovePlace = (placeId) => {
    setSelectedPlaces(prev => prev.filter(place => place.placeId !== placeId));
  };

  // Đổi avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert("Chỉ chấp nhận file ảnh (JPEG, JPG, PNG)");
      return;
    }

    // Kiểm tra kích thước (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 5MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmitAvatar = async () => {
    if (!avatarFile) {
      alert("Vui lòng chọn ảnh trước khi upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      formData.append('userId', user.id); // Nếu cần gửi thêm ID

      console.log('Uploading avatar...');

      const response = await axios.post('/api/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Server response:', response);

      if (response.data.success) {
        const updatedUser = {
          ...user,
          avatar: `/uploads/avatars/${response.data.filename}`
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        alert("Đổi ảnh đại diện thành công!");
        setActiveTab(null);
        setAvatarFile(null);
        setAvatarPreview('');
      } else {
        alert(response.data.error || "Đổi ảnh thất bại");
      }

    } catch (error) {
      console.error("Lỗi khi upload:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Không thể kết nối đến server");
      }
    }
  };

  // Lấy địa điểm phổ biến
  const fetchRandomPopularPlaces = async () => {
    try {
      const response = await axios.get('/api/popular-places');
      if (response.data?.length > 0) {
        setRecommendations(response.data.map(place => ({
          id: place.id,
          title: place.title,
          description: place.description,
          location: place.location,
          category: place.category,
          image: place.image,
          map_link: place.map_link
        })));
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy địa điểm phổ biến:", error);
      setRecommendations([]);
    }
  };

  // Click vào địa điểm
  const handlePlaceClick = async (place) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.id) return;
      
      const historyResponse = await axios.get(`/api/user-history-ids/${userData.id}`);
      const sourcePlaceIds = historyResponse.data.map(item => item.placeId);
      
      await axios.post('/api/save-ground-truth', {
        user_id: userData.id,
        source_place_id: sourcePlaceIds.join('|'),
        clicked_place_ids: place.id,
        timestamp: new Date().toISOString()
      });
      
      navigate(`/destination/${place.id}`);
    } catch (error) {
      console.error("Error saving ground truth:", error);
    }
  };

  if (!user) return <div className="loading">Đang tải hồ sơ người dùng...</div>;

  return (
    <>
      <Navbar />
      <div className="user-profile-container">
        <div className="left-column">
          <div className="profile-header">
            <div className="profile-info">
              <img src={user.avatar} alt="User Avatar" className="profile-avatar" />
              <div className="profile-text">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>
            </div>
            
            <div className="profile-actions">
              <button 
                className={`profile-action-btn ${activeTab === 'add-place' ? 'active' : ''}`}
                onClick={() => setActiveTab(activeTab === 'add-place' ? null : 'add-place')}
              >
                <FaPlus /> Thêm địa điểm
              </button>
              
              <button 
                className={`profile-action-btn ${activeTab === 'change-avatar' ? 'active' : ''}`}
                onClick={() => setActiveTab(activeTab === 'change-avatar' ? null : 'change-avatar')}
              >
                <FaEdit /> Đổi ảnh đại diện
              </button>
            </div>
          </div>

          {/* Modal thêm địa điểm */}
          {activeTab === 'add-place' && (
            <div className="profile-modal">
              <div className="modal-content">
                <button className="close-modal" onClick={() => setActiveTab(null)}>
                  <FaTimes />
                </button>
                <h3>Thêm địa điểm đã đến</h3>
                
                {selectedPlaces.length > 0 && (
                  <div className="selected-place-count">
                    <strong>Địa điểm đã chọn:</strong> {selectedPlaces.length} địa điểm
                  </div>
                )}
                
                <div className="form-group">
                  <label>Tìm địa điểm</label>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Nhập tên địa điểm..."
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        handleSearchPlace(e.target.value);
                      }}
                    />
                    {searchResults.length > 0 && (
                      <ul className="search-results">
                        {searchResults.map(place => (
                          <li key={place.id} onClick={() => handlePlaceSelect(place)}>
                            <img 
                              src={`https://drive.google.com/thumbnail?id=${place.image}`} 
                              alt={place.name}
                              onError={(e) => e.target.src = '/default-image.jpg'}
                            />
                            <div className="place-info">
                              <h4>{place.name}</h4>
                              <p>{place.location}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                {selectedPlaces.map((place, index) => (
                  <div key={place.placeId} className="selected-place-block">
                    <div className="place-info-summary">
                      <h4>{place.placeName}</h4>
                      <p><strong>Vị trí:</strong> {place.location}</p>
                      <p><strong>Thể loại:</strong> {place.category || 'Không rõ'}</p>
                    </div>
                    
                    <div className="date-inputs">
                      <div className="form-group">
                        <label>Ngày bắt đầu</label>
                        <input
                          type="date"
                          value={place.startDate}
                          onChange={(e) => {
                            const newPlaces = [...selectedPlaces];
                            newPlaces[index].startDate = e.target.value;
                            setSelectedPlaces(newPlaces);
                          }}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Ngày kết thúc</label>
                        <input
                          type="date"
                          value={place.endDate}
                          onChange={(e) => {
                            const newPlaces = [...selectedPlaces];
                            newPlaces[index].endDate = e.target.value;
                            setSelectedPlaces(newPlaces);
                          }}
                          required
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="remove-place-btn"
                      onClick={() => handleRemovePlace(place.placeId)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                
                <div className="modal-actions">
                  <button 
                    className="submit-btn"
                    onClick={handleAddPlace}
                    disabled={selectedPlaces.length === 0}
                  >
                    Lưu địa điểm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal đổi avatar */}
          {activeTab === 'change-avatar' && (
            <div className="profile-modal">
              <div className="modal-content">
                <button className="close-modal" onClick={() => setActiveTab(null)}>
                  <FaTimes />
                </button>
                <h3>Đổi ảnh đại diện</h3>
                
                <div className="avatar-preview-container">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview" />
                  ) : (
                    <img 
                      src={user.avatar} 
                      alt="Current Avatar" 
                      className="avatar-preview"
                      onError={(e) => e.target.src = '/default-avatar.jpg'}
                    />
                  )}
                </div>
                
                <div className="form-group">
                  <label className="file-upload-btn">
                    Chọn ảnh mới
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                  <p className="file-upload-hint">Chọn ảnh có kích thước tối đa 5MB (JPG, PNG)</p>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="submit-btn"
                    onClick={handleSubmitAvatar}
                    disabled={!avatarFile}
                  >
                    Lưu ảnh đại diện
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Gợi ý địa điểm */}
          <div className="recommendations-section">
            <h2>Gợi ý cho bạn</h2>
            
            {recommendations.length === 0 ? (
              <p className="empty-message">Thêm nhiều địa điểm hơn để nhận gợi ý phù hợp.</p>
            ) : (
              <div className="recommendations-grid">
                {recommendations.map(place => (
                  <PlaceCard className="place-card"
                    key={place.id} 
                    place={place}
                    onClick={() => handlePlaceClick(place)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lịch sử du lịch */}
        <div className="right-column">
          <div className="travel-history-section">
            <h2>Lịch sử du lịch</h2>
            
            {travelHistory.length === 0 ? (
              <p className="empty-message">Bạn chưa thêm địa điểm nào.</p>
            ) : (
              <div className="timeline">
                {travelHistory.map(item => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-date">
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </div>
                    
                    <div className="timeline-content">
                      <div className="place-image-container">
                        <img
                          src={`https://drive.google.com/thumbnail?id=${item.placeImg}`}
                          alt={item.placeName}
                          onError={(e) => e.target.src = '/default-image.jpg'}
                        />
                      </div>
                      
                      <div className="place-details">
                        <h3>{item.placeName}</h3>
                        <p className="location">{item.location}</p>
                        <span className="category-badge">{item.category}</span>
                      </div>
                      
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeletePlace(item.id)}
                        title="Xóa địa điểm"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default UserProfile;