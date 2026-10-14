import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://healthbotbackend.onrender.com',
  withCredentials: true,
});

export default API;
