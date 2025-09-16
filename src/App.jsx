import React, { useEffect, useState } from "react";
import DebugService from "./services/DebugService.js";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [mainClass, setMainClass] = useState("");
  const [className, setClassName] = useState("");
  const [lineNumber, setLineNumber] = useState("");
  const [breakpoints, setBreakpoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");
  const [isDark, setIsDark] = useState(
    typeof window !== "undefined" &&
      (localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches))
  );

  // Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (_) {}
  }, [isDark]);

  // Subscribe to debug events
  useEffect(() => {
    const id = DebugService.onDebugEvent((event) => {
      setEvents((prev) => [...prev, event]);
    });
    return () => DebugService.offDebugEvent(id);
  }, []);

  const handleError = (prefix, err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (typeof err?.response?.data === "string"
        ? err.response.data
        : null) ||
      err?.message ||
      "Unknown error";
    setStatus(`${prefix}: ${msg}`);
  };

  const createSession = async () => {
    try {
      const id = await DebugService.createSession();
      setSessionId(id);
      setStatus(`Session created: ${id}`);
      await DebugService.connectWebSocket();
      DebugService.subscribeToSession(id);
    } catch (err) {
      handleError("Error creating session", err);
    }
  };

  const launch = async () => {
    if (!sessionId || !mainClass) {
      setStatus("Please create a session and enter a main class.");
      return;
    }
    try {
      const msg = await DebugService.launchTarget(mainClass);
      setStatus(msg);
    } catch (err) {
      handleError("Error launching", err);
    }
  };

  const addBreakpoint = async () => {
    if (!sessionId || !className || !lineNumber) {
      setStatus("Enter class name and line number.");
      return;
    }
    try {
      const msg = await DebugService.addBreakpoint(
        className,
        parseInt(lineNumber, 10)
      );
      setBreakpoints((prev) => [...prev, { className, lineNumber }]);
      setStatus(msg);
      setClassName("");
      setLineNumber("");
    } catch (err) {
      handleError("Error adding breakpoint", err);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      <header className="relative bg-gradient-to-r from-sky-600 to-purple-600 p-6 text-center shadow-md">
        <h1 className="text-3xl font-bold text-white">Java Debugger</h1>
        <p className="opacity-90 text-white/90">
          Interactive debugging interface for your Java backend
        </p>
        <button
          onClick={() => setIsDark((v) => !v)}
          className="absolute top-4 right-4 rounded-md px-3 py-1 text-white bg-black/30 hover:bg-black/40"
          aria-label="Toggle theme"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Create Session */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Create Session</h2>
          <button
            onClick={createSession}
            disabled={!!sessionId}
            className="rounded-md bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 disabled:opacity-50"
          >
            {sessionId ? "Session Active" : "Create Debug Session"}
          </button>
          {sessionId && (
            <p className="mt-2 text-sm text-emerald-500">
              Session ID: {sessionId}
            </p>
          )}
        </section>

        {/* Launch Target */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Launch Target</h2>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={mainClass}
              onChange={(e) => setMainClass(e.target.value)}
              placeholder="com.example.Main"
              className="flex-1 border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={launch}
              disabled={!sessionId}
              className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 disabled:opacity-50"
            >
              Launch
            </button>
          </div>
        </section>

        {/* Breakpoints */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Breakpoints</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm mb-1">Class Name</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="com.example.MyClass"
                className="w-full border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Line</label>
              <input
                type="number"
                value={lineNumber}
                onChange={(e) => setLineNumber(e.target.value)}
                placeholder="42"
                className="w-28 border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              onClick={addBreakpoint}
              disabled={!sessionId}
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {breakpoints.map((bp, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="font-mono">
                  {bp.className}:{bp.lineNumber}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Debug Events */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Debug Events</h2>
          <div className="max-h-64 overflow-y-auto space-y-2 border-t dark:border-gray-700 pt-3">
            {events.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No events yet…
              </p>
            ) : (
              events.map((ev, i) => (
                <div
                  key={i}
                  className={`rounded p-2 font-mono text-sm ${
                    ev.type === "init"
                      ? "bg-emerald-100 dark:bg-emerald-700 text-emerald-800 dark:text-emerald-100"
                      : ev.type === "debug"
                      ? "bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100"
                      : ev.type === "error"
                      ? "bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-200"
                  }`}
                >
                  [{ev.type}] {ev.data}
                </div>
              ))
            )}
          </div>
        </section>

        {status && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{status}</p>
        )}
      </main>

      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-6">
        © {new Date().getFullYear()} Java Debugger. Built with React + Vite.
      </footer>
    </div>
  );
}
