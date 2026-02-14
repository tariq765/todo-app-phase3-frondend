// API utility functions for interacting with the backend

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Makes an authenticated API request
 */
export async function authenticatedRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Get the auth token from wherever it's stored (localStorage, cookies, etc.)
  const token = localStorage.getItem('auth_token');

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.message || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    };
  }
}

/**
 * Makes a public API request (without authentication)
 */
export async function publicRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.message || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    };
  }
}

// Specific API functions for authentication
export const authApi = {
  login: (email: string, password: string) =>
    publicRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    publicRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => {
    // Remove the auth token from storage
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: () =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`),
};

// Specific API functions for tasks
export const tasksApi = {
  getAll: (userId: string) =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/tasks`),

  getById: (userId: string, taskId: string) =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/tasks/${taskId}`),

  create: (userId: string, taskData: { title: string; description?: string }) =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  update: (userId: string, taskId: string, taskData: Partial<{ title: string; description?: string; completed: boolean }>) =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),

  toggleComplete: (userId: string, taskId: string, completed: boolean) =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),

  delete: (userId: string, taskId: string) =>
    authenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),
};