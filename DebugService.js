import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class DebugService {
  constructor() {
             this.baseURL = process.env.REACT_APP_API_URL || '';
    this.socket = null;
    this.stompClient = null;
    this.sessionId = null;
    this.eventCallbacks = new Map();
  }

  async createSession() {
    try {
      const response = await axios.post(`${this.baseURL}/api/debug/session`);
      this.sessionId = response.data.sessionId;
      return this.sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async launchTarget(mainClass = 'com.example.sample.ExampleApp') {
    if (!this.sessionId) throw new Error('No active session');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/debug/session/${this.sessionId}/launch`, {
        mainClass,
        classpath: ''
      });
      return response.data;
    } catch (error) {
      console.error('Failed to launch target:', error);
      throw error;
    }
  }

  async addBreakpoint(className, line) {
    if (!this.sessionId) throw new Error('No active session');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/debug/session/${this.sessionId}/breakpoint`, {
        className,
        line
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add breakpoint:', error);
      throw error;
    }
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new SockJS(`${this.baseURL}/ws`);
        this.stompClient = Stomp.over(this.socket);
        this.stompClient.debug = null;
        
        this.stompClient.connect({}, 
          (frame) => {
            resolve();
          },
          (error) => {
            reject(error);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribeToSession(sessionId) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.subscribe(`/topic/debug/${sessionId}`, (message) => {
        try {
          const event = JSON.parse(message.body);
          this.handleDebugEvent(event);
        } catch (error) {
          console.error('Error parsing debug event:', error);
        }
      });
    }
  }

  handleDebugEvent(event) {
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  onDebugEvent(callback) {
    const id = Date.now() + Math.random();
    this.eventCallbacks.set(id, callback);
    return id;
  }

  offDebugEvent(callbackId) {
    this.eventCallbacks.delete(callbackId);
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
    this.eventCallbacks.clear();
  }
}

export default new DebugService();
