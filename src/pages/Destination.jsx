import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Destination.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Destination = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [place, setPlace] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const loggedInUserId = Number(localStorage.getItem('user_id')) || 0;

    useEffect(() => {
        const fetchData = async () => {
            try {
            const placeResponse = await axios.get(`/api/place/${id}`);
            setPlace(placeResponse.data);

            // Lấy user_id từ localStorage
            const userData = localStorage.getItem('user');
            const loggedInUserId = userData ? JSON.parse(userData).id : '0';
            
            console.log("Sending request with:", {
                id: placeResponse.data.id,
                user_id: loggedInUserId
            });

            const suggestionsResponse = await axios.post('/api/suggest', {
                id: placeResponse.data.id,
                user_id: loggedInUserId
            }, {
                headers: {
                'Content-Type': 'application/json'
                }
            });
            
            console.log("Recommendations received:", suggestionsResponse.data);
            setSuggestions(suggestionsResponse.data.recommendations || []);
            } catch (error) {
            console.error("Error fetching data:", error.response ? error.response.data : error.message);
            } finally {
            setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!place) return <div className="error-message">Không tìm thấy thông tin địa điểm</div>;

    return (
        <div>
            <Navbar />
            <div className="destination-container">
                <div className="info-suggestion-wrapper">
                    <div className="destination-info">
                        <div className="destination-card">
                            <iframe
                                src={`https://drive.google.com/file/d/${place["ID Ảnh URL địa điểm"]}/preview`}
                                title={place["Tên địa điểm"]}
                                className="destination-frame"
                                allow="autoplay"
                            />

                            <div className="destination-card two-column-layout">
                                {/* Cột bên trái: Thông tin địa điểm */}
                                <div className="left-column">
                                    <h1>{place["Tên địa điểm"]}</h1>
                                    <p><strong>Tỉnh thành:</strong> {place["Tỉnh thành"]}</p>
                                    <p><strong>Thể loại:</strong> {place["Thể loại"]}</p>
                                    <p><strong>Mô tả:</strong> {place["Mô tả"]}</p>
                                    <div className="map-container">
                                    {place["Link google map"] ? (
                                        <a
                                        href={place["Link google map"]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        >
                                        Xem bản đồ trên Google Maps
                                        </a>
                                    ) : (
                                        <p>Không có link bản đồ hợp lệ.</p>
                                    )}
                                    </div>
                                </div>

                                {/* Cột bên phải: Gợi ý */}
                                <div className="right-column suggestions-container">
                                    <h2>Gợi ý điểm đến cho bạn</h2>
                                    {suggestions.length === 0 ? (
                                    <p>Không có gợi ý phù hợp.</p>
                                    ) : (
                                    suggestions.map((suggestion, index) => {
                                        console.log("Suggestion:", suggestion);
                                        return (
                                        <div
                                            className="suggestion-card"
                                            key={index}
                                            onClick={() => navigate(`/destination/${suggestion.id}`)}
                                            style={{ cursor: 'pointer' }} // tùy chọn: trỏ chuột dạng "bàn tay"
                                        >
                                            <img
                                            src={`https://drive.google.com/thumbnail?id=${suggestion.image}`}
                                            alt={suggestion.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/default-image.jpg';
                                            }}
                                            />
                                            <div className="info">
                                            <h3>{suggestion.title}</h3>
                                            <p><strong>{suggestion.location}</strong></p>
                                            <p>{suggestion.category}</p>
                                            </div>
                                            <button
                                            className="save-button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Ngăn việc click vào button cũng trigger điều hướng
                                                // TODO: xử lý lưu yêu thích nếu cần
                                            }}
                                            >
                                            Save
                                            </button>
                                        </div>);
                                    })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Destination;
