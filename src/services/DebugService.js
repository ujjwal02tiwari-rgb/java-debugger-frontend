import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class DebugService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '';
    this.socket = null;
    this.stompClient = null;
    this.sessionId = null;
    this.eventCallbacks = new Map();
  }

  async createSession() {
    const { data } = await axios.post(`${this.baseURL}/api/debug/session`);
    this.sessionId = data.sessionId;
    return this.sessionId;
  }

  async launchTarget(mainClass) {
    if (!this.sessionId) throw new Error('No active session');
    const { data } = await axios.post(
      `${this.baseURL}/api/debug/session/${this.sessionId}/launch`,
      { mainClass, classpath: '' }
    );
    return data;
  }

  async addBreakpoint(className, line) {
    if (!this.sessionId) throw new Error('No active session');
    const { data } = await axios.post(
      `${this.baseURL}/api/debug/session/${this.sessionId}/breakpoint`,
      { className, line }
    );
    return data;
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new SockJS(`${this.baseURL}/ws`);
        this.stompClient = Stomp.over(this.socket);
        // Disable debug logging
        this.stompClient.debug = null;
        this.stompClient.connect({}, () => resolve(), (error) => reject(error));
      } catch (e) {
        reject(e);
      }
    });
  }

  subscribeToSession(sessionId) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.subscribe(`/topic/debug/${sessionId}`, (message) => {
        try {
          const event = JSON.parse(message.body);
          this.handleDebugEvent(event);
        } catch (e) {
          console.error('Error parsing debug event:', e);
        }
      });
    }
  }

  handleDebugEvent(event) {
    this.eventCallbacks.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error('Event callback error:', e);
      }
    });
  }

  onDebugEvent(cb) {
    const id = `${Date.now()}_${Math.random()}`;
    this.eventCallbacks.set(id, cb);
    return id;
  }

  offDebugEvent(id) {
    this.eventCallbacks.delete(id);
  }

  disconnect() {
    if (this.stompClient) this.stompClient.disconnect();
    this.eventCallbacks.clear();
  }
}

export default new DebugService();
