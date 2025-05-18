import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MainPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PlaceCard from '../components/PlaceCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const MainPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await axios.get('/api/popular-destinations');
        if (!response.data || response.data.length === 0) {
          throw new Error("Dữ liệu trống");
        }
        setDestinations(response.data);
      } catch (err) {
        setError("Không thể tải dữ liệu địa điểm");
        console.error("Error fetching destinations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? destinations.length - 4 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev >= destinations.length - 4 ? 0 : prev + 1));
  };

  const visibleDestinations = destinations.slice(currentIndex, currentIndex + 4);

  const handlePlaceClick = (place) => {
    navigate(`/destination/${place.id}`, { state: { place } });
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="home-container">
        <div className="overlay">
          <h1 className="title">Explore Vietnam with Us</h1>
          <p className="subtitle">Discover amazing places at exclusive deals</p>
          <button 
            className="cta-button"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>

      <div className="popular-destination">
        <h2 className="tt">Popular Destinations</h2>
        <div className="carousel-container">
          <button className="carousel-button prev" onClick={handlePrev}>
            <FaChevronLeft />
          </button>
          
          <div className="carousel">
            {visibleDestinations.map((place) => (
              <PlaceCard 
                key={place.id}
                place={place}
                onClick={() => handlePlaceClick(place)}
              />
            ))}
          </div>
          
          <button className="carousel-button next" onClick={handleNext}>
            <FaChevronRight />
          </button>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default MainPage;