'use client';

import { useState, useEffect, useRef } from 'react';
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

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { logout, token, user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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

  // Listen for task updates from chatbot
  useEffect(() => {
    const handleTaskUpdate = () => {
      const token = localStorage.getItem('auth_token');
      if (token && userId) {
        fetchTasks(token, userId);
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate);
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
        const taskData = response.data;
        setTasks([taskData, ...tasks]);
        setNewTask({ title: '', description: '' });
        setError('');
        console.log('Task created successfully:', taskData);

        // Add success message to chat
        if (chatMessages.length === 0) {
          setChatMessages([
            {
              id: 'welcome',
              content: 'Hello! I am your AI Task Assistant. You can ask me to add, list, complete, delete, or update tasks.',
              role: 'assistant',
              timestamp: new Date()
            },
            {
              id: 'task-created',
              content: `Task "${taskData.title}" has been successfully added to your list!`,
              role: 'assistant',
              timestamp: new Date()
            }
          ]);
        } else {
          setChatMessages(prev => [...prev, {
            id: 'task-created',
            content: `Task "${taskData.title}" has been successfully added to your list!`,
            role: 'assistant',
            timestamp: new Date()
          }]);
        }
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

  // Chat functionality
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatInput.trim() || !userId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: chatInput,
      role: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatIsLoading(true);

    try {
      console.log('[DEBUG] Sending message to backend:', chatInput);
      console.log('[DEBUG] API URL:', `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/chat`);
      console.log('[DEBUG] Token available:', !!token);
      console.log('[DEBUG] User ID:', userId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: chatInput }),
      });

      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ERROR] Backend response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('[DEBUG] Backend response data:', data);

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Check if the response indicates a task was created/updated
      if (data.tool_calls && Array.isArray(data.tool_calls) && data.tool_calls.some((call: any) =>
        call.name === 'add_task' || call.name === 'complete_task' ||
        call.name === 'delete_task' || call.name === 'update_task' ||
        call.function?.name === 'add_task' || call.function?.name === 'complete_task' ||
        call.function?.name === 'delete_task' || call.function?.name === 'update_task')) {
        // Dispatch a custom event to notify other pages to refresh tasks
        window.dispatchEvent(new CustomEvent('taskUpdated'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error processing your request: ${error instanceof Error ? error.message : 'Please try again'}`,
        role: 'assistant',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Task Management */}
          <div className="lg:w-2/3">
            <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
              <p className="text-gray-600">Manage your tasks efficiently and use AI assistance</p>
            </div>

            {/* Task Creation Form */}
            <div className="mb-6">
              <form onSubmit={handleCreateTask} className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="What needs to be done?"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Add details..."
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Task List */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Your Tasks</h2>
                <p className="text-sm text-gray-600">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {tasks.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No tasks yet</p>
                    <p className="text-gray-400 mt-1">Add your first task or ask the AI assistant to help</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition duration-150">
                      {editingTask && editingTask.id === task.id ? (
                        // Edit mode
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
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
                              className="ml-3 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base font-medium"
                            />
                          </div>
                          <textarea
                            value={editingTask?.description || ''}
                            onChange={(e) => setEditingTask(editingTask ? {...editingTask, description: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2 text-sm"
                            rows={2}
                            placeholder="Description..."
                          />
                          <div className="flex space-x-3 mt-3">
                            <button
                              onClick={() => saveEditedTask(task.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTaskCompletion(task.id.toString(), task.completed)}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className={`ml-3 text-base font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditing(task)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition duration-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteTask(task.id.toString())}
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition duration-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="mt-1 ml-8 text-sm text-gray-600">{task.description}</p>
                          )}
                          <p className="mt-2 ml-8 text-xs text-gray-400">
                            Created: {new Date(task.created_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - AI Chatbot */}
          <div className="lg:w-1/3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
              <div className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">AI Task Assistant</h2>
                      <p className="text-blue-100 text-sm">Always here to help you manage your tasks</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white overflow-hidden flex flex-col">
                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-12">
                      <div className="mb-6">
                        <div className="bg-blue-100 rounded-full p-4 inline-block">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">How can I help you today?</h3>
                      <p className="text-gray-600 max-w-md">Try asking me to:</p>
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-left">
                          <p className="text-sm text-blue-700">• Add a new task "Buy groceries"</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-left">
                          <p className="text-sm text-blue-700">• Show my tasks</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-left">
                          <p className="text-sm text-blue-700">• Complete task 1</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-left">
                          <p className="text-sm text-blue-700">• Update a task</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'} text-right`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {chatIsLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 rounded-2xl px-4 py-3 max-w-[85%] border border-gray-200 rounded-bl-none shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                          </div>
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Panel */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me to manage your tasks..."
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      disabled={chatIsLoading}
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white rounded-xl px-5 py-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-300 flex items-center"
                      disabled={chatIsLoading || !chatInput.trim()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </form>
                  <div className="mt-3 flex justify-center">
                    <Link href="/chat" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                      Open full chat
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}