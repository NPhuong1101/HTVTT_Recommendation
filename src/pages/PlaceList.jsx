import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import '../styles/PlaceList.css';
import dimage from '../../public/Images/default-image.jpg'

const PlaceList = () => {
  const [places, setPlaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/data/Info-trip.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("CSV đã đọc:", results.data);
            setPlaces(results.data.slice(0, 20));
          },
        });
      });
  }, []);
  

  const handleClick = async (place) => {
    try {
      const response = await fetch('http://localhost:5000/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "Tên địa điểm": place["Tên địa điểm"] }),
      });
  
      const data = await response.json();
  
      navigate(`/destination/${place.ID}`, {
        state: {
          place: place,
          suggestions: data.suggestions
        }
      });
    } catch (error) {
      console.error("Lỗi khi gọi API gợi ý:", error);
    }
  };
  

  return (
    <div className="place-list">
      <h2>Danh sách địa điểm nổi bật</h2>
      <div className="place-grid">
        {places.map((place, idx) => (
          <div key={idx} className="place-card" onClick={() => handleClick(place)}>
            <img
              src={`https://drive.google.com/thumbnail?id=${place["ID Ảnh URL địa điểm"]}`}
              alt={place["Tên địa điểm"]}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = dimage; // ảnh mặc định khi lỗi
              }}
            />
            <h3>{place["Tên địa điểm"]}</h3>
            <p>{place["Tỉnh thành"]}</p>
            <p>{place["Thể loại"]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaceList;
