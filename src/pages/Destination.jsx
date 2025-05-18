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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy thông tin địa điểm
                const placeResponse = await axios.get(`/api/place/${id}`);
                setPlace(placeResponse.data);
                
                // Lấy gợi ý
                const suggestionsResponse = await axios.post('/api/suggest', {
                    id: placeResponse.data["id"]  // ← dùng ID thay vì title
                });

                setSuggestions(suggestionsResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
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
                            <img
                                src={`https://drive.google.com/thumbnail?id=${place["ID Ảnh URL địa điểm"]}`}
                                alt={place["Tên địa điểm"]}
                                className="destination-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-image.jpg';
                                }}
                            />
                            <h1>{place["Tên địa điểm"]}</h1>
                            <p><strong>Tỉnh thành:</strong> {place["Tỉnh thành"]}</p>
                            <p><strong>Mô tả:</strong> {place["Mô tả"]}</p>
                            <div className="map-container">
                                {place["Link google map"] && (
                                    <iframe
                                        src={place["Link google map"].replace('view', 'embed')}
                                        width="600"
                                        height="450"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="suggestions-container">
                        <h2>Gợi ý điểm đến cho bạn</h2>
                        {suggestions.length === 0 ? (
                            <p>Không có gợi ý phù hợp.</p>
                        ) : (
                            suggestions.map((suggestion, index) => (
                                <div className="suggestion-card" key={index}>
                                    <img
                                        src={`https://drive.google.com/thumbnail?id=${suggestion.image}`}
                                        alt={suggestion.title}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = defaultImage;
                                        }}
                                    />
                                    <div className="info">
                                        <h3>{suggestion.title}</h3>
                                        <p><strong>{suggestion.category}</strong></p>
                                        <p>{suggestion.description}</p>
                                    </div>
                                    <div className="rating">⭐ 4.5</div>
                                    <button className="save-button">Save</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Destination;