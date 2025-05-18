import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PlaceCard.css';

const PlaceCard = ({ place, onClick }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/destination/${place.id}`, { state: { place } });
  };

  return (
    <div className="place-card" onClick={handleClick}>
      <div className="image-container">
        <img
          src={`https://drive.google.com/thumbnail?id=${place.image}`}
          alt={place.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-image.jpg';
          }}
        />
      </div>
      <div className="card-content">
        <h3>{place.title}</h3>
        <p className="location">{place.location}</p>
        <span className="category-badge">{place.category.split(',')[0]}</span>
      </div>
    </div>
  );
};

export default PlaceCard;