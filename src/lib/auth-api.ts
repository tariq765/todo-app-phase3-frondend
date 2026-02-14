// API utility functions specifically for authentication

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user_id: string;
  user: any;
}

/**
 * Login API call
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

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
 * Register API call
 */
export async function register(userData: RegisterData): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

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
 * Verify token API call
 */
export async function verifyToken(token: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

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