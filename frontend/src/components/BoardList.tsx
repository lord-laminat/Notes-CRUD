import React, { useState, useEffect } from 'react';
import { boards } from '../api';
import type { Board } from '../types';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BoardListProps {
  onSelectBoard: (board: Board) => void;
}

export function BoardList({ onSelectBoard }: BoardListProps) {
  const [boardList, setBoardList] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const { data } = await boards.getAll();
      setBoardList(data);
    } catch (error) {
      toast.error('Failed to load boards');
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const { data } = await boards.create(newBoardTitle);
      setBoardList([...boardList, data]);
      setNewBoardTitle('');
      setIsCreateModalOpen(false);
      toast.success('Board created successfully!');
    } catch (error) {
      toast.error('Failed to create board');
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    try {
      await boards.delete(boardId);
      setBoardList(boardList.filter((board) => board.id !== boardId));
      toast.success('Board deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete board');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Boards</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5" />
          New Board
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Board</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBoard}>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Board title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boardList.map((board) => (
          <div
            key={board.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{board.title}</h3>
              <button
                onClick={() => handleDeleteBoard(board.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 space-y-2">
              {board.tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm text-gray-600 truncate">
                  • {task.title}
                </div>
              ))}
              {board.tasks.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{board.tasks.length - 3} more tasks
                </div>
              )}
              {board.tasks.length === 0 && (
                <div className="text-sm text-gray-500 italic">No tasks yet</div>
              )}
            </div>
            <button
              onClick={() => onSelectBoard(board)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              View All Tasks ({board.tasks.length})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}