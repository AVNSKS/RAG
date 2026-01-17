import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const askQuestion = async (question) => {
  const response = await api.post('/ask', { question });
  return response.data;
};

export const uploadFile = async (file, clearOld = false) => {
  const formData = new FormData();
  formData.append('file', file);
  if (clearOld) {
    formData.append('clear_old', 'true');
  }
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFiles = async () => {
  const response = await api.get('/files');
  return response.data;
};

export const clearDatabase = async () => {
  const response = await api.post('/database/clear');
  return response.data;
};

export const getDatabaseStats = async () => {
  const response = await api.get('/database/stats');
  return response.data;
};

export const deleteFile = async (filename) => {
  const response = await api.delete(`/files/${encodeURIComponent(filename)}`);
  return response.data;
};

export default api;
