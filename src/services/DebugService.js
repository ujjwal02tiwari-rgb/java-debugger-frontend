import axios from "axios";
import API_BASE_URL from "../config";

// Store subscribers for debug events
let eventListeners = {};
let nextListenerId = 0;
let eventSource = null;

const DebugService = {
  // ---- Create Session ----
  async createSession() {
    const res = await axios.post(`${API_BASE_URL}/sessions`);
    return res.data; // backend returns sessionId string
  },

  // ---- Launch Target ----
  async launchTarget(target) {
    const res = await axios.post(`${API_BASE_URL}/launch`, { target });
    return res.data;
  },

  // ---- Add Breakpoint ----
  async addBreakpoint(className, line) {
    const res = await axios.post(`${API_BASE_URL}/breakpoints`, {
      className,
      line,
    });
    return res.data;
  },

  // ---- Connect to SSE stream ----
  async connectWebSocket() {
    if (eventSource) {
      eventSource.close();
    }
    eventSource = new EventSource(`${API_BASE_URL}/events`);

    eventSource.onmessage = (e) => {
      // default message
      try {
        const data = JSON.parse(e.data);
        for (let id in eventListeners) {
          eventListeners[id](data);
        }
      } catch {
        for (let id in eventListeners) {
          eventListeners[id](e.data);
        }
      }
    };

    eventSource.addEventListener("debug", (e) => {
      try {
        const data = JSON.parse(e.data);
        for (let id in eventListeners) {
          eventListeners[id](data);
        }
      } catch {
        for (let id in eventListeners) {
          eventListeners[id](e.data);
        }
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
      eventSource = null;
    };
  },

  // ---- Subscribe to events ----
  onDebugEvent(callback) {
    const id = nextListenerId++;
    eventListeners[id] = callback;
    return id;
  },

  // ---- Unsubscribe ----
  offDebugEvent(id) {
    delete eventListeners[id];
  },

  // ---- Session Subscription (optional stub) ----
  subscribeToSession(sessionId) {
    // You could send a message if backend supported WS
    console.log(`Subscribed to session: ${sessionId}`);
  },
};

export default DebugService;
