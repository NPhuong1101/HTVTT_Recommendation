import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./PersonalizedSuggestions.css";
import NhaTrang from '../assets/NhaTrang.jpg';
import DaLat from '../assets/DaLat.jpg';
import Hue from '../assets/Hue.jpg';
import PhuQuoc from '../assets/PhuQuoc.jpg';
import MocChau from '../assets/MocChau.jpg';

const travelHistory = [
  { id: 1, location: "Đà Nẵng", category: "Biển" },
  { id: 2, location: "Sapa", category: "Núi" },
  { id: 3, location: "Hội An", category: "Văn hóa" }
];

const allDestinations = [
  {
    id: 4,
    location: "Nha Trang",
    category: "Biển",
    description: "Thành phố biển với những bãi cát trắng và nước trong xanh.",
    image: NhaTrang,
    rating: 4.5,
    ratingCount: 250
  },
  {
    id: 5,
    location: "Đà Lạt",
    category: "Núi",
    description: "Thành phố ngàn hoa với khí hậu mát mẻ quanh năm.",
    image: DaLat,
    rating: 4.7,
    ratingCount: 100
  },
  {
    id: 6,
    location: "Huế",
    category: "Văn hóa",
    description: "Cố đô với nhiều di tích lịch sử và nét đẹp văn hóa cổ kính.",
    image: Hue,
    rating: 4.8,
    ratingCount: 150
  },
  {
    id: 7,
    location: "Phú Quốc",
    category: "Biển",
    description: "Hòn đảo thiên đường với những bãi biển tuyệt đẹp và hải sản tươi ngon.",
    image: PhuQuoc,
    rating: 4.6,
    ratingCount: 200
  },
  {
    id: 8,
    location: "Mộc Châu",
    category: "Núi",
    description: "Thiên đường của hoa cải, đồi chè và khí hậu trong lành.",
    image: MocChau,
    rating: 4.4,
    ratingCount: 300
  }
];

function getSuggestions(history, destinations) {
  const preferredCategories = history.map((h) => h.category);
  return destinations.filter((d) => preferredCategories.includes(d.category));
}

export default function PersonalizedSuggestions() {
  return (
    <div>
      <div className="suggestions-container">
        <h2>Gợi ý điểm đến cho bạn</h2>
        {allDestinations.map((place) => (
          <div className="suggestion-card" key={place.id}>
            <img src={place.image} alt={place.location} />
            <div className="info">
              <h3>{place.location}</h3>
              <p><strong>{place.category}</strong></p>
              <p>{place.description}</p>
            </div>
            <div className="rating">
              ⭐ {place.rating} <span className="rating-count">({place.ratingCount})</span>
            </div>
            <button className="save-button">Save</button>
          </div>
        ))}
      </div>
    </div>
  );
}