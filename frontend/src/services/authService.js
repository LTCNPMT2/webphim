import api from './api.js';

// Backend trả { success, message, data } nên mỗi hàm lấy sẵn res.data.data
export const register = (payload) => api.post('/auth/register', payload).then((res) => res.data.data); // { user, token }
export const login = (email, password) => api.post('/auth/login', { email, password }).then((res) => res.data.data); // { user, token }
export const googleLogin = (payload) => api.post('/auth/google', payload).then((res) => res.data.data); // { user, token }
export const getMe = () => api.get('/auth/me').then((res) => res.data.data.user);
export const updateProfile = (payload) => api.put('/auth/profile', payload).then((res) => res.data.data.user);
export const changePassword = (payload) => api.put('/auth/change-password', payload).then((res) => res.data);
