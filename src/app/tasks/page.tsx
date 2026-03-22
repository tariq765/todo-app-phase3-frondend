'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  getUserTasks as getUserTasksApi,
  createTask as createTaskApi,
  toggleTaskCompletion as toggleTaskCompletionApi,
  deleteTask as deleteTaskApi,
  updateTask as updateTaskApi
} from '@/lib/task-api';
import { getUserIdFromToken } from '@/lib/jwt-utils';
import Link from 'next/link';

// Define TypeScript interfaces
interface Task {
  id: number | string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface EditingTask {
  id: string | number | null;
  title: string;
  description: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { logout } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const extractedUserId = getUserIdFromToken(token);
    if (!extractedUserId) {
      router.push('/login');
      return;
    }

    setUserId(extractedUserId);
  }, [router]);

  // Fetch tasks on load and set up auto-refresh
  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        fetchTasks(token, userId);
      } else {
        router.push('/login');
      }
    }
  }, [userId, router]);

  // Listen for custom events to refresh tasks when they're created via chat
  useEffect(() => {
    const handleTaskUpdated = () => {
      const token = localStorage.getItem('auth_token');
      if (token && userId) {
        fetchTasks(token, userId);
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdated);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated);
    };
  }, [userId]);

  // Set up auto-refresh every 30 seconds to show chatbot tasks
  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const interval = setInterval(() => {
          fetchTasks(token, userId);
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval); // Cleanup on unmount
      }
    }
  }, [userId]);

  const fetchTasks = async (token: string, userId: string) => {
    if (!userId) {
      router.push('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await getUserTasksApi(userId, token);

      if (response.data) {
        setTasks(response.data);
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        router.push('/login');
      } else {
        setError(response.error || 'Failed to load tasks');
      }
    } catch (err) {
      setError('An error occurred while loading tasks');
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }

    const token = localStorage.getItem('auth_token'); // Or however you store the JWT
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    try {
      // Ensure the completed field is included with default value of false
      const taskData = {
        ...newTask,
        completed: false
      };

      // Log the data being sent for debugging
      console.log('Creating task with data:', taskData);
      console.log('Using userId:', userId);

      const response = await createTaskApi(userId, taskData, token);

      if (response.data) {
        setTasks([response.data, ...tasks]);
        setNewTask({ title: '', description: '' });
        setError('');
        console.log('Task created successfully:', response.data);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError(response.error || 'Failed to create task');
        console.error('API response error:', response);
      }
    } catch (err) {
      setError('An error occurred while creating task');
      console.error('Create task error:', err);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('auth_token'); // Or however you store the JWT
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await toggleTaskCompletionApi(userId, taskId, !currentStatus, token);

      if (response.data) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        ));
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Toggle task error:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    const token = localStorage.getItem('auth_token'); // Or however you store the JWT
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await deleteTaskApi(userId, taskId, token);

      if (response.status === 200 || response.status === 204) {
        setTasks(tasks.filter(task => task.id !== taskId));
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || ''
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
  };

  const saveEditedTask = async (taskId: string | number) => {
    if (!editingTask) return;

    const token = localStorage.getItem('auth_token');
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    try {
      const taskIdStr = typeof taskId === 'string' ? taskId : taskId.toString();

      console.log('Updating task with ID:', taskIdStr);
      console.log('Update data:', {
        title: editingTask.title,
        description: editingTask.description,
      });

      const response = await updateTaskApi(
        userId,
        taskIdStr,
        {
          title: editingTask.title,
          description: editingTask.description,
        },
        token
      );

      if (response.data) {
        setTasks(tasks.map(task =>
          task.id.toString() === taskIdStr ? { ...task, ...response.data } : task
        ));
        setEditingTask(null);
        console.log('Task updated successfully:', response.data);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError(response.error || 'Failed to update task');
        console.error('Update task API response:', response);
      }
    } catch (err) {
      setError('An error occurred while updating task');
      console.error('Update task error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            My Tasks
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Manage your tasks efficiently and boost your productivity
          </p>
        </div>

        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Chat Assistant Banner */}
          <div className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold">Need help managing your tasks?</h2>
                <p className="mt-2 text-blue-100 text-lg">
                  Use our AI-powered chat assistant to add, list, complete, or manage your tasks with natural language.
                </p>
                <p className="mt-2 text-blue-200 text-sm">
                  Note: After adding tasks via chat, they will automatically appear here within 30 seconds.
                </p>
              </div>
              <Link
                href="/chat"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
                Open Chat Assistant
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{tasks.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{tasks.filter(t => t.completed).length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{tasks.filter(t => !t.completed).length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                const token = localStorage.getItem('auth_token');
                if (token && userId) {
                  fetchTasks(token, userId);
                } else {
                  router.push('/login');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh Tasks
            </button>
          </div>

          {/* Task Creation Form */}
          <div className="mb-8">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Task</h3>
                <p className="mt-1 text-sm text-gray-500">Add a new task to your list</p>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleCreateTask}>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border"
                        placeholder="What needs to be done?"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border"
                        placeholder="Add details..."
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <button
                        type="submit"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-3 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Task
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Tasks</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {tasks.filter(t => !t.completed).length} pending
              </span>
            </div>
            <ul className="divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <li className="px-6 py-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                </li>
              ) : (
                tasks.map((task) => (
                  <li key={task.id} className="px-6 py-6 hover:bg-gray-50 transition-colors duration-150">
                    {editingTask && editingTask.id === task.id ? (
                      // Edit mode
                      <div className="mb-4">
                        <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id.toString(), task.completed)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            value={editingTask?.title || ''}
                            onChange={(e) => setEditingTask(editingTask ? {...editingTask, title: e.target.value} : null)}
                            className="ml-3 flex-1 px-3 py-2 border rounded-lg text-lg font-medium"
                          />
                        </div>
                        <textarea
                          value={editingTask?.description || ''}
                          onChange={(e) => setEditingTask(editingTask ? {...editingTask, description: e.target.value} : null)}
                          className="w-full px-3 py-2 border rounded-lg mt-2 text-sm"
                          rows={2}
                          placeholder="Description..."
                        />
                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={() => saveEditedTask(task.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompletion(task.id.toString(), task.completed)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                            />
                            <div className="ml-3">
                              <span className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </span>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                              )}
                              <p className="mt-2 text-xs text-gray-400">
                                Created: {new Date(task.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(task)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTask(task.id.toString())}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}