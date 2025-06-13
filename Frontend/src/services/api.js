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

  // Session management
  async createSession(userId, topic = 'New chat') {
    console.log('📝 Creating new session for user:', userId, 'with topic:', topic);
    try {
      const result = await this.request('/create_session', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          topic: topic
        })
      });
      console.log('✅ Session created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  }

  async updateSessionTopic(sessionId, topic) {
    console.log('📝 Updating session topic:', { sessionId, topic });
    try {
      const result = await this.request('/update_session_topic', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          topic: topic
        })
      });
      console.log('✅ Session topic updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Session topic update failed:', error);
      throw error;
    }
  }

  async processPDF(file, userId, sessionId) {
    console.log('📄 Processing PDF:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      formData.append('session_id', sessionId);

      const response = await fetch(`${this.baseURL}/process_pdf/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      console.log('✅ PDF processed successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error processing PDF:', error);
      throw error;
    }
  }

  async processYouTubeVideo(url, userId, sessionId) {
    console.log('🎥 Processing YouTube video:', url);
    try {
      const response = await fetch(`${this.baseURL}/process_youtube_video/?url=${encodeURIComponent(url)}&user_id=${userId}&session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to process YouTube video');
      }

      const data = await response.json();
      console.log('✅ YouTube video processed successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error processing YouTube video:', error);
      throw error;
    }
  }

  async processContentToEmbeddings(userId, sessionId) {
    try {
      const requestBody = {
        user_id: userId,
        session_id: sessionId,
        chunk_size: 500,
        batch_size: 64
      }
      
      console.log('Processing content to embeddings with request:', requestBody)
      
      const response = await fetch(`${this.baseURL}/content_to_embeddings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend error response:', errorData)
        throw new Error(errorData.detail?.[0]?.msg || 'Failed to process content to embeddings')
      }

      const data = await response.json()
      console.log('Content processed to embeddings:', data)
      return data
    } catch (error) {
      console.error('❌ Error processing content to embeddings:', error)
      throw error
    }
  }

  async queryLLM(userId, sessionId, query) {
    try {
      console.log('Querying LLM with:', { userId, sessionId, query })
      const response = await fetch(`${this.baseURL}/query-llm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          query: query
        }),
      })

      const responseData = await response.json()
      console.log('Raw response from backend:', responseData)

      if (!response.ok) {
        console.error('Backend error response:', responseData)
        const errorMessage = responseData.detail?.message || 
                           responseData.detail?.error || 
                           responseData.error || 
                           'Failed to get response from LLM'
        throw new Error(errorMessage)
      }

      // Return the response data directly without trying to parse nested JSON
      // The body will be handled properly in the frontend
      return responseData
    } catch (error) {
      console.error('Error in queryLLM:', error)
      throw error
    }
  }
}

export default new ApiService(); 