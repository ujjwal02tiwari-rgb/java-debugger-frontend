import axios from "axios";
import API_BASE_URL from "../config";

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
  async launchTarget(mainClass) {
    const res = await axios.post(`${API_BASE_URL}/launch`, { mainClass });
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

    // Default message handler
    eventSource.onmessage = (e) => {
      this._notifyListeners({ type: "message", data: e.data });
    };

    // Explicit event listeners
    eventSource.addEventListener("init", (e) => {
      this._notifyListeners({ type: "init", data: e.data });
    });

    eventSource.addEventListener("debug", (e) => {
      this._notifyListeners({ type: "debug", data: e.data });
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      this._notifyListeners({ type: "error", data: "SSE connection error" });
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

  // ---- Internal notifier ----
  _notifyListeners(event) {
    for (let id in eventListeners) {
      try {
        eventListeners[id](event);
      } catch (err) {
        console.error("Listener error:", err);
      }
    }
  },

  // ---- Session subscription (stub) ----
  subscribeToSession(sessionId) {
    console.log(`Subscribed to session: ${sessionId}`);
  },
};

export default DebugService;
