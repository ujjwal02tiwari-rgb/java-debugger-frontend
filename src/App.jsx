import React, { useState, useEffect } from "react";
import DebugService from "./services/DebugService";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [mainClass, setMainClass] = useState("");
  const [breakpoints, setBreakpoints] = useState([]);
  const [className, setClassName] = useState("");
  const [lineNumber, setLineNumber] = useState("");
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Listen for debug events
    const id = DebugService.onDebugEvent((event) => {
      setEvents((prev) => [...prev, event]);
    });
    return () => DebugService.offDebugEvent(id);
  }, []);

  const createSession = async () => {
    try {
      const id = await DebugService.createSession();
      setSessionId(id);
      setStatus(`Session created: ${id}`);
      await DebugService.connectWebSocket();
      DebugService.subscribeToSession(id);
    } catch (err) {
      setStatus(`Error creating session: ${err.message}`);
    }
  };

  const launch = async () => {
    if (!sessionId || !mainClass) {
      setStatus("Please create a session and enter a main class.");
      return;
    }
    try {
      await DebugService.launchTarget(mainClass);
      setStatus(`Launched ${mainClass}. Waiting for events…`);
    } catch (err) {
      setStatus(`Error launching: ${err.message}`);
    }
  };

  const addBreakpoint = async () => {
    if (!sessionId || !className || !lineNumber) {
      setStatus("Enter class name and line number.");
      return;
    }
    try {
      await DebugService.addBreakpoint(className, parseInt(lineNumber, 10));
      setBreakpoints((prev) => [...prev, { className, lineNumber }]);
      setStatus(`Breakpoint added: ${className}:${lineNumber}`);
      setClassName("");
      setLineNumber("");
    } catch (err) {
      setStatus(`Error adding breakpoint: ${err.message}`);
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Java Debugger App</h1>

      <section style={{ marginBottom: 20 }}>
        <button onClick={createSession} disabled={!!sessionId}>
          {sessionId ? "Session Active" : "Create Debug Session"}
        </button>
        {sessionId && <p>Session ID: {sessionId}</p>}
      </section>

      <section style={{ marginBottom: 20 }}>
      <h2>Launch Target</h2>
        <input
          type="text"
          placeholder="Main class (e.g. com.example.Main)"
          value={mainClass}
          onChange={(e) => setMainClass(e.target.value)}
          style={{ marginRight: 8, minWidth: 300 }}
        />
        <button onClick={launch} disabled={!sessionId}>
          Launch
        </button>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2>Add Breakpoint</h2>
        <input
          type="text"
          placeholder="Class name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Line"
          value={lineNumber}
          onChange={(e) => setLineNumber(e.target.value)}
          style={{ marginRight: 8, width: 80 }}
        />
        <button onClick={addBreakpoint} disabled={!sessionId}>
          Add
        </button>
        <ul>
          {breakpoints.map((bp, idx) => (
            <li key={idx}>
              {bp.className}:{bp.lineNumber}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2>Debug Events</h2>
        {events.length === 0 ? (
          <p>No events yet…</p>
        ) : (
          <pre
            style={{
              background: "#f5f5f5",
              padding: 12,
              maxHeight: 250,
              overflow: "auto",
            }}
          >
            {events.map((ev, idx) => (
              <div key={idx}>{JSON.stringify(ev, null, 2)}</div>
            ))}
          </pre>
        )}
      </section>

      {status && <p style={{ color: "#333" }}>{status}</p>}
    </main>
  );
}

