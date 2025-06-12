const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🔧 ApiService initialized with baseURL:', this.baseURL);
  }

  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
    console.log('📋 Auth headers prepared:', { hasToken: !!token, headers: Object.keys(headers) });
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    console.log('🚀 Making API request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? 'Present' : 'None'
    });

    try {
      console.log('⏳ Fetching:', url);
      const response = await fetch(url, config);
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.detail || 'Request failed');
      }

      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('💥 API Request failed:', {
        error: error.message,
        url,
        config
      });
      throw error;
    }
  }

  // Authentication methods
  async signup(userData) {
    console.log('👤 Signup request started:', { email: userData.email, username: userData.username });
    try {
      const result = await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          username: userData.username,
          password: userData.password
        })
      });
      console.log('✅ Signup successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  }

  async login(credentials) {
    console.log('🔐 Login request started:', { email: credentials.email });
    try {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });
      console.log('✅ Login successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    console.log('👤 Getting current user...');
    try {
      const result = await this.request('/auth/me');
      console.log('✅ Current user retrieved:', result);
      return result;
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      throw error;
    }
  }

  async logout() {
    console.log('🚪 Logout request started...');
    try {
      const result = await this.request('/auth/logout', {
        method: 'POST'
      });
      console.log('✅ Logout successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  // Token management
  setToken(token) {
    console.log('🔑 Setting token:', token ? `${token.substring(0, 20)}...` : 'null');
    localStorage.setItem('accessToken', token);
  }

  removeToken() {
    console.log('🗑️ Removing token');
    localStorage.removeItem('accessToken');
  }

  getToken() {
    const token = localStorage.getItem('accessToken');
    console.log('🔍 Getting token:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    console.log('🔒 Checking authentication...');
    const token = this.getToken();
    if (!token) {
      console.log('❌ No token found');
      return false;
    }

    try {
      // Check if token is expired (basic check)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ Invalid token format');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const isValid = payload.exp * 1000 > Date.now();
      console.log('🔒 Token validation:', {
        exp: new Date(payload.exp * 1000),
        now: new Date(),
        isValid
      });
      return isValid;
    } catch (error) {
      console.log('❌ Token validation error:', error);
      return false;
    }
  }
}

export default new ApiService(); 