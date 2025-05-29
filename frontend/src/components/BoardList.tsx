import React, { useState, useEffect } from 'react';
import { boards } from '../api';
import type { Board } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BoardListProps {
  onSelectBoard: (board: Board) => void;
}

export function BoardList({ onSelectBoard }: BoardListProps) {
  const [boardList, setBoardList] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');

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
      <h2 className="text-2xl font-bold mb-6">Your Boards</h2>
      
      <form onSubmit={handleCreateBoard} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder="New board title"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5" />
            Add Board
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boardList.map((board) => (
          <div
            key={board.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{board.title}</h3>
              <button
                onClick={() => handleDeleteBoard(board.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => onSelectBoard(board)}
              className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              View Tasks ({board.tasks.length})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}