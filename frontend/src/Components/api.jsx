import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL !== undefined 
    ? process.env.REACT_APP_API_URL 
    : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'),
  withCredentials: true,
});

export default API;
