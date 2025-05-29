import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { Auth } from './components/Auth';
import { BoardList } from './components/BoardList';
import { TaskList } from './components/TaskList';
import type { Board } from './types';
import { Toaster } from 'react-hot-toast';
import { LogOut } from 'lucide-react';

function App() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const { token, clearToken } = useAuthStore();

  const handleLogout = () => {
    clearToken();
    setSelectedBoard(null);
  };

  if (!token) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {selectedBoard ? (
          <TaskList board={selectedBoard} onBack={() => setSelectedBoard(null)} />
        ) : (
          <BoardList onSelectBoard={setSelectedBoard} />
        )}
      </main>
      
      <Toaster />
    </div>
  );
}

export default App;