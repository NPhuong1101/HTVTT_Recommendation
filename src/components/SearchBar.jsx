import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchPlaces = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/search-places', {
        params: { query }
      });
      setResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (place) => {
    navigate(`/destination/${place.id}`, { state: { place } });
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    searchPlaces();
  }
};

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm kiếm địa điểm..."
          className="search-input"
        />
        {isLoading && <div className="search-spinner"></div>}
      </div>

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((place) => (
            <li key={place.id} onClick={() => handleSelect(place)}>
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
  );
};

export default SearchBar;