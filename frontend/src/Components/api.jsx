import axios from 'axios';

// When hosted as a unified full-stack service on Render (e.g. dietlog-41ua.onrender.com),
// always use same-origin relative URLs so requests stay on the same server and avoid CORS issues.
const isRenderDeployment = typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com');

const API = axios.create({
  baseURL: isRenderDeployment
    ? ''
    : (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')),
  withCredentials: true,
});

export default API;
