const API_BASE_URL = 'https://api.bitechx.com';

type AuthResponse = {
  token: string;
};

export const authService = {
  async login(email: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to authenticate');
    }

    const data: AuthResponse = await response.json();
    localStorage.setItem('authToken', data.token);
    return data.token;
  },

  getAuthHeader(): { Authorization: string } | null {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  logout(): void {
    localStorage.removeItem('authToken');
  },
};
