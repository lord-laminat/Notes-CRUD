import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse, Board, Task, User } from '../types';

const API_URL = 'http://localhost:8000'; // Update with your API URL

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (username: string, email: string, password: string) =>
    api.post<User>('/register', { username, email, password }),
  
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/login', new URLSearchParams({ username, password })),
};

export const boards = {
  getAll: () => api.get<Board[]>('/boards/'),
  get: (id: number) => api.get<Board>(`/boards/${id}`),
  create: (title: string) => api.post<Board>('/boards/', { title }),
  update: (id: number, title: string) => api.put<Board>(`/boards/${id}`, { title }),
  delete: (id: number) => api.delete<Board>(`/boards/${id}`),
};

export const tasks = {
  getForBoard: (boardId: number) => api.get<Task[]>(`/boards/${boardId}/tasks/`),
  create: (boardId: number, title: string, content: string) =>
    api.post<Task>(`/boards/${boardId}/tasks/`, { title, content }),
  update: (taskId: number, title: string, content: string) =>
    api.put<Task>(`/tasks/${taskId}`, { title, content }),
  delete: (taskId: number) => api.delete<Task>(`/tasks/${taskId}`),
};