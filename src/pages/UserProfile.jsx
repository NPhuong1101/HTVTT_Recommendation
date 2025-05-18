import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserProfile.css';
import PlaceCard from '../components/PlaceCard';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const UserProfile = () => {
  const navigate = useNavigate();

  const [travelHistory, setTravelHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  
  const [searchResults, setSearchResults] = useState([]);

  const [user, setUser] = useState(null);

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
        const historyData = historyResponse.data;

        setTravelHistory(historyData);

        fetchRecommendations(historyData);
      } catch (error) {
        console.error("Error loading travel history:", error);
      }
    };

    loadUserHistory();
  }, []);


  const fetchRecommendations = async (history) => {
    if (history.length === 0) return;
    
    try {
      const categories = [...new Set(history.map(item => item.category))];
      const response = await axios.post('/api/suggest', { categories });
      setRecommendations(response.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
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
    if (!newPlace.placeId || !newPlace.startDate || !newPlace.endDate) return;
    
    try {
      // Lấy thông tin địa điểm từ searchResults
      const selectedPlace = searchResults.find(p => p.id === newPlace.placeId);
      
      const updatedHistory = [
        ...travelHistory,
        {
          id: Date.now().toString(),
          userId: user.id,
          placeId: newPlace.placeId,
          placeName: newPlace.placeName,
          category: selectedPlace?.category || '',
          startDate: newPlace.startDate,
          endDate: newPlace.endDate,
          created_at: new Date().toISOString()
        }
      ];
      
      setTravelHistory(updatedHistory);
      
      // Lưu vào CSV
      await axios.post('/api/save-travel-history', {
        userId: user.id,
        placeId: newPlace.placeId,
        startDate: newPlace.startDate,
        endDate: newPlace.endDate,
      });
      
      // Reset form
      setNewPlace({ 
        placeId: '', 
        placeName: '', 
        startDate: '', 
        endDate: '',
      });
      setSearchResults([]);
      setSearchInput('');
      setIsAddingPlace(false);
    } catch (error) {
      console.error("Error adding place:", error);
    }
  };

  const handleDeletePlace = async (placeId) => {
    try {
      // Xóa khỏi state
      const updatedHistory = travelHistory.filter(item => item.id !== placeId);
      setTravelHistory(updatedHistory);
      
      // Cập nhật CSV
      await axios.delete(`/api/travel-history/${placeId}`);
    } catch (error) {
      console.error("Error deleting place:", error);
    }
  };

  const handlePlaceSelect = (place) => {
    setNewPlace({
      ...newPlace,
      placeId: place.id,
      placeName: place.name,
      category: place.category // Thêm thể loại vào state
    });
    setSearchResults([]); // Xóa kết quả tìm kiếm
    setSearchInput(''); // Xóa input tìm kiếm
  };

  // Thêm state cho searchInput
  const [searchInput, setSearchInput] = useState('');

  return !user ? (
    <div>Đang tải hồ sơ người dùng...</div>
  ) : (
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
                      onClick={() => setNewPlace({
                        ...newPlace,
                        placeId: place.id,
                        placeName: place.name
                      })}
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
          
          <div className="form-row">
            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                value={newPlace.startDate}
                onChange={(e) => setNewPlace({...newPlace, startDate: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Ngày kết thúc</label>
              <input
                type="date"
                value={newPlace.endDate}
                onChange={(e) => setNewPlace({...newPlace, endDate: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setIsAddingPlace(false)}
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
                    <h3>{item.placeName}</h3>
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
  );
};

export default UserProfile;