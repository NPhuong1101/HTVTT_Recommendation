import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserProfile.css';
import PlaceCard from '../components/PlaceCard';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const UserProfile = () => {
  const navigate = useNavigate();

  const [travelHistory, setTravelHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [user, setUser] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);

  function isOverlapping(start1, end1, start2, end2) {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 <= e2 && s2 <= e1;
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/'); // Chưa đăng nhập => về trang chính hoặc đăng nhập
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
        fetchRecommendations(historyData, parsedUser.id);
      } catch (error) {
        console.error("Error loading travel history:", error);
      }
    };

    loadUserHistory();
  }, []);

  const fetchRecommendations = async (history, userId) => {
    if (history.length === 0 || !userId) return;

    try {
      const response = await axios.post('/api/suggest/user', {
        user_id: userId
      });
      
      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    }
  };

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

  const handleAddPlace = async () => {
    const validPlaces = selectedPlaces.filter(p => p.placeId && p.startDate && p.endDate);
    if (validPlaces.length === 0) return;

    // 1. Kiểm tra trùng lặp trong selectedPlaces
    for (let i = 0; i < validPlaces.length; i++) {
      for (let j = i + 1; j < validPlaces.length; j++) {
        if (isOverlapping(validPlaces[i].startDate, validPlaces[i].endDate, validPlaces[j].startDate, validPlaces[j].endDate)) {
          alert(`Khoảng thời gian của địa điểm "${validPlaces[i].placeName}" bị trùng với "${validPlaces[j].placeName}".`);
          return;
        }
      }
    }

    // 2. Kiểm tra trùng lặp với travelHistory đã lưu
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
        updatedHistory.push({
          id: Date.now().toString() + Math.random(),
          userId: user.id,
          placeId: place.placeId,
          placeName: place.placeName,
          category: place.category || '',
          startDate: place.startDate,
          endDate: place.endDate,
          created_at: new Date().toISOString()
        });

        await axios.post('/api/save-travel-history', {
          userId: user.id,
          placeId: place.placeId,
          startDate: place.startDate,
          endDate: place.endDate
        });
      }

      setTravelHistory(updatedHistory);
      setSelectedPlaces([]);
      setIsAddingPlace(false);
    } catch (error) {
      console.error("Error adding places:", error);
    }
  };

  const handleDeletePlace = async (id) => {
    try {
      const res = await fetch(`/api/delete-user-place/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        alert("Đã xóa địa điểm!");
        // Cập nhật lại state để xóa khỏi giao diện
        setTravelHistory(prev => prev.filter(item => item.id !== id));
      } else {
        alert(data.error || "Xóa thất bại!");
      }
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      alert("Lỗi kết nối khi xóa!");
    }
  };

  const handlePlaceSelect = (place) => {
    if (selectedPlaces.some(p => p.placeId === place.id)) return; // Không thêm trùng

    setSelectedPlaces(prev => [
      ...prev,
      {
        placeId: place.id,
        placeName: place.name,
        category: place.category,
        location: place.location,
        startDate: '',
        endDate: ''
      }
    ]);
    setSearchResults([]);
    setSearchInput('');
  };

  const handleRemovePlace = (placeId) => {
    setSelectedPlaces(prev => prev.filter(place => place.placeId !== placeId));
  };

  useEffect(() => {
    if (user && travelHistory.length > 0) {
      fetchRecommendations(travelHistory, user.id);
    }
  }, [travelHistory]);

  return !user ? (
    <div>Đang tải hồ sơ người dùng...</div>
  ) : (
    <>
      <Navbar />
      <div className="user-profile-container">
        <div className="profile-header">
          <div className="profile-info">
            <img src={user.avatar} alt="User Avatar" className="profile-avatar" />
            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>
          <button 
            className="add-place-btn"
            onClick={() => setIsAddingPlace(!isAddingPlace)}
          >
            <FaPlus /> Thêm địa điểm
          </button>
        </div>

        {isAddingPlace && (
          <div className="add-place-form">
            <h3>Thêm địa điểm đã đến</h3>
            {selectedPlaces.length > 0 && (
              <div className="selected-place">
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
                      <li 
                        key={place.id}
                        onClick={() => handlePlaceSelect(place)}
                      >
                        <img 
                          src={`https://drive.google.com/thumbnail?id=${place.image}`} 
                          alt={place.name}
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
              <div key={place.placeId} className="form-row selected-place-block">
                <div className="form-group full-width">
                  <label>Thông tin địa điểm đã chọn</label>
                  <div className="selected-place-info">
                    <p><strong>Tên:</strong> {place.placeName}</p>
                    <p><strong>Vị trí:</strong> {place.location}</p>
                    <p><strong>Thể loại:</strong> {place.category || 'Không rõ'}</p>
                  </div>
                </div>

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

                <div className="form-group">
                  <button type="button" onClick={() => handleRemovePlace(place.placeId)}>Xóa</button>
                </div>
              </div>
            ))}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setIsAddingPlace(false);
                  setSelectedPlaces([]);
                }}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="submit-btn"
                onClick={handleAddPlace}
              >
                Lưu
              </button>
            </div>
          </div>
        )}

        <div className="travel-history-section">
          <h2>Lịch sử du lịch</h2>
          {travelHistory.length === 0 ? (
            <p>Bạn chưa thêm địa điểm nào.</p>
          ) : (
            <div className="timeline">
              {travelHistory.map(item => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-date">
                    {item.startDate} - {item.endDate}
                  </div>
                  <div className="timeline-content">
                    <div className="place-header">
                      <div className="image-container">
                        <img
                          src={`https://drive.google.com/thumbnail?id=${item.placeImg}`}
                          alt={item.placeName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-image.jpg';
                          }}
                        />
                      </div>
                      <h3>{item.placeName}</h3>
                      <p>{item.location}</p>
                      <span className="category-badge">{item.category}</span>
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeletePlace(item.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recommendations-section">
          <h2>Gợi ý cho bạn</h2>
          {recommendations.length === 0 ? (
            <p>Thêm nhiều địa điểm hơn để nhận gợi ý phù hợp.</p>
          ) : (
            <div className="recommendations-grid">
              {recommendations.map(place => (
                <PlaceCard 
                  key={place.id} 
                  place={place}
                  onClick={() => navigate(`/destination/${place.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;