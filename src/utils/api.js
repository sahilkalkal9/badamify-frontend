import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:5000/api",
  baseURL: "https://badamify-backend-dvw2.onrender.com/api",
});

export default api;