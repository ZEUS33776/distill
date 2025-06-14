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
  async createSession(userId, title = 'New Chat') {
    console.log('📝 Creating new session for user:', userId, 'with title:', title);
    try {
      const result = await this.request('/create_session', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          title: title,
          topic: title  // Use title as topic for now
        })
      });
      console.log('✅ Session created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  }

  async getUserSessions(userId) {
    console.log('📋 Fetching sessions for user:', userId);
    console.log('🔗 Request URL:', `${this.baseURL}/user/${userId}/sessions`);
    console.log('🔑 Auth token present:', !!this.getToken());
    
    try {
      const result = await this.request(`/user/${userId}/sessions`, {
        method: 'GET'
      });
      console.log('✅ Sessions fetched successfully. Count:', result?.length || 0);
      console.log('📊 Session data:', result);
      
      if (!result || result.length === 0) {
        console.warn('⚠️ No sessions returned from API');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Session fetching failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      throw error;
    }
  }

  async getSessionMessages(sessionId) {
    console.log('💬 Fetching messages for session:', sessionId);
    try {
      const result = await this.request(`/session/${sessionId}/messages`, {
        method: 'GET'
      });
      console.log('✅ Messages fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Message fetching failed:', error);
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

  async deleteSession(sessionId) {
    console.log('🗑️ Deleting session:', sessionId);
    try {
      const result = await this.request('/delete_session', {
        method: 'DELETE',
        body: JSON.stringify({
          session_id: sessionId
        })
      });
      console.log('✅ Session deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Session deletion failed:', error);
      throw error;
    }
  }

  async deleteStudySession(studySessionId) {
    console.log('🗑️ Deleting study session:', studySessionId);
    try {
      const result = await this.request(`/study-sessions/${studySessionId}`, {
        method: 'DELETE'
      });
      console.log('✅ Study session deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Study session deletion failed:', error);
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
    console.log('🎥 [YT-DEBUG] Starting YouTube video processing...');
    console.log('🎥 [YT-DEBUG] URL:', url);
    console.log('🎥 [YT-DEBUG] User ID:', userId);
    console.log('🎥 [YT-DEBUG] Session ID:', sessionId);
    
    const startTime = Date.now();
    
    try {
      const requestUrl = `${this.baseURL}/process_youtube_video/?url=${encodeURIComponent(url)}&user_id=${userId}&session_id=${sessionId}`;
      console.log('🎥 [YT-DEBUG] Request URL:', requestUrl);
      console.log('🎥 [YT-DEBUG] Making API call...');
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      console.log('🎥 [YT-DEBUG] Response status:', response.status);
      console.log('🎥 [YT-DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎥 [YT-DEBUG] Error response body:', errorText);
        throw new Error(`Failed to process YouTube video: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      console.log('✅ [YT-DEBUG] YouTube video processed successfully!');
      console.log('✅ [YT-DEBUG] Processing time:', `${duration}ms`);
      console.log('✅ [YT-DEBUG] Response data:', data);
      console.log('✅ [YT-DEBUG] Transcript length:', data.transcript_length || 'N/A');
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [YT-DEBUG] YouTube processing failed!');
      console.error('❌ [YT-DEBUG] Error after:', `${duration}ms`);
      console.error('❌ [YT-DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  async processContentToEmbeddings(userId, sessionId) {
    console.log('🔄 [EMBED-DEBUG] Starting content to embeddings processing...');
    console.log('🔄 [EMBED-DEBUG] User ID:', userId);
    console.log('🔄 [EMBED-DEBUG] Session ID:', sessionId);
    
    const startTime = Date.now();
    
    try {
      const requestBody = {
        user_id: userId,
        session_id: sessionId,
        chunk_size: 500,
        batch_size: 64
      }
      
      console.log('🔄 [EMBED-DEBUG] Request body:', requestBody);
      console.log('🔄 [EMBED-DEBUG] Making embeddings API call...');
      
      const response = await fetch(`${this.baseURL}/content_to_embeddings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🔄 [EMBED-DEBUG] Response status:', response.status);
      console.log('🔄 [EMBED-DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔄 [EMBED-DEBUG] Backend error response:', errorData)
        throw new Error(errorData.detail?.[0]?.msg || 'Failed to process content to embeddings')
      }

      const data = await response.json()
      const duration = Date.now() - startTime;
      
      console.log('✅ [EMBED-DEBUG] Content processed to embeddings successfully!');
      console.log('✅ [EMBED-DEBUG] Processing time:', `${duration}ms`);
      console.log('✅ [EMBED-DEBUG] Response data:', data);
      console.log('✅ [EMBED-DEBUG] Chunks processed:', data.chunks_processed || 'N/A');
      console.log('✅ [EMBED-DEBUG] Embeddings created:', data.embeddings_created || 'N/A');
      
      return data
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [EMBED-DEBUG] Embeddings processing failed!');
      console.error('❌ [EMBED-DEBUG] Error after:', `${duration}ms`);
      console.error('❌ [EMBED-DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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