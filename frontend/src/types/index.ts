export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Board {
  id: number;
  title: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  title: string;
  content: string;
  board_id: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}