import axios from 'axios';

export const getPlaceSuggestions = (title) => 
  axios.post('http://localhost:5000/api/suggest', { title });

export const getUserSuggestions = (categories) =>
  axios.post('http://localhost:5000/api/user-suggestions', { categories });

export const getSuggestions = async (title) => {
  try {
    const response = await fetch('http://localhost:5000/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Fetch error:", err);
    throw err; // Re-throw để component có thể bắt lỗi
  }
};