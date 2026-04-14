import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://b4rssvfc-5000.inc1.devtunnels.ms/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getErrorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;
