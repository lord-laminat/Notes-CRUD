import React, { useState, useEffect } from 'react';
import { tasks } from '../api';
import type { Board, Task } from '../types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TaskListProps {
  board: Board;
  onBack: () => void;
}

export function TaskList({ board, onBack }: TaskListProps) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', content: '' });

  useEffect(() => {
    loadTasks();
  }, [board.id]);

  const loadTasks = async () => {
    try {
      const { data } = await tasks.getForBoard(board.id);
      setTaskList(data);
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.content.trim()) return;

    try {
      const { data } = await tasks.create(board.id, newTask.title, newTask.content);
      setTaskList([...taskList, data]);
      setNewTask({ title: '', content: '' });
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await tasks.delete(taskId);
      setTaskList(taskList.filter((task) => task.id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Boards
        </button>
        <h2 className="text-2xl font-bold">{board.title}</h2>
      </div>

      <form onSubmit={handleCreateTask} className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <textarea
              value={newTask.content}
              onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
              placeholder="Task content"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5" />
            Add Task
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {taskList.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="mt-2 text-gray-600">{task.content}</p>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}