import React, { useState, useEffect } from 'react';
import DebugService from './services/DebugService.js';

/**
 * The main application component.  This implementation uses Tailwind CSS for
 * styling and implements a light/dark mode toggle.  It also wraps the
 * Java debugger functionality exposed by DebugService.  The dark mode
 * behaviour follows Tailwind's `class` strategy — see `tailwind.config.js`.
 */
export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [mainClass, setMainClass] = useState('');
  const [breakpoints, setBreakpoints] = useState([]);
  const [className, setClassName] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Initialise dark mode based on stored preference or system setting.  This
  // runs only on mount.  We use window.matchMedia to honour the user's
  // preference if no localStorage key is set【665853189734185†L189-L200】.
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    if (dark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  // Subscribe to debug events on mount and unsubscribe on unmount.
  useEffect(() => {
    const id = DebugService.onDebugEvent((event) => {
      // Append new events to the list; clone to force React update.
      setEvents((prev) => [...prev, event]);
    });
    return () => DebugService.offDebugEvent(id);
  }, []);

  // Toggle between light and dark themes.  Updating the `dark` class on
  // documentElement lets Tailwind apply `dark:` variants as documented【665853189734185†L132-L176】.
  const toggleTheme = () => {
    setIsDark((prev) => {
      const newState = !prev;
      document.documentElement.classList.toggle('dark', newState);
      localStorage.setItem('theme', newState ? 'dark' : 'light');
      return newState;
    });
  };

  // Create a new debugging session.  If successful, connect the WebSocket and
  // subscribe to events on the returned session ID.
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

  // Launch the debugger target for the given main class.
  const launchTarget = async () => {
    if (!sessionId || !mainClass) {
      setStatus('Please create a session and enter a main class.');
      return;
    }
    try {
      await DebugService.launchTarget(mainClass);
      setStatus(`Launched ${mainClass}. Waiting for events…`);
    } catch (err) {
      setStatus(`Error launching: ${err.message}`);
    }
  };

  // Add a breakpoint for the specified class and line.
  const addBreakpointHandler = async () => {
    if (!sessionId || !className || !lineNumber) {
      setStatus('Enter class name and line number.');
      return;
    }
    try {
      await DebugService.addBreakpoint(className, parseInt(lineNumber, 10));
      setBreakpoints((prev) => [...prev, { className, line: lineNumber }]);
      setStatus(`Breakpoint added: ${className}:${lineNumber}`);
      setClassName('');
      setLineNumber('');
    } catch (err) {
      setStatus(`Error adding breakpoint: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Header with gradient and theme toggle */}
      <header className="relative bg-gradient-to-r from-brand-600 to-purple-600 p-6 text-center shadow-md">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 focus:outline-none"
        >
          {/* Sun icon shows in light mode; moon shows in dark mode */}
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a1 1 0 01.993.883L11 3v14a1 1 0 01-1.993.117L9 17V3a1 1 0 011-1z" />
              <path d="M5.05 5.05a7 7 0 109.9 9.9 7 7 0 00-9.9-9.9z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M5 12H4m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"
              />
            </svg>
          )}
        </button>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">Java Debugger</h1>
        <p className="mt-2 text-gray-200">Interactive debugging interface for your Java backend</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Create Session Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m4-2v6m0 0V9a1 1 0 10-2 0v5m2-5h2a2 2 0 012 2v2a2 2 0 01-2 2h-2zM5 10h2M7 6h2m0 12h2m-4-3v-2M9 16H7a2 2 0 01-2-2v-2a2 2 0 012-2h2m0 0h6"
              />
            </svg>
            Create Session
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Start a new debugging session with your backend.
          </p>
          <button
            onClick={createSession}
            disabled={!!sessionId}
            className="px-4 py-2 rounded-lg font-medium bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors disabled:opacity-50"
          >
            {sessionId ? 'Session Active' : 'Start Session'}
          </button>
          <p className="mt-2 text-green-500 text-sm">
            {sessionId ? `Session ID: ${sessionId}` : 'No session yet. Click to start.'}
          </p>
        </section>

        {/* Main Class Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 6h13M8 12h13m-13 6h13M3 6h.01M3 12h.01M3 18h.01"
              />
            </svg>
            Main Class
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <input
              type="text"
              placeholder="com.example.Main"
              value={mainClass}
              onChange={(e) => setMainClass(e.target.value)}
              className="flex-1 p-2 border rounded-md focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={launchTarget}
              disabled={!sessionId}
              className="px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition-colors disabled:opacity-50"
            >
              Launch
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Specify the fully qualified name of the main class you want to debug.
          </p>
        </section>

        {/* Breakpoints Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m2 0a2 2 0 110-4 2 2 0 010 4z"
              />
            </svg>
            Breakpoints
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add and manage breakpoints in your code.</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" htmlFor="className">
                Class Name
              </label>
              <input
                id="className"
                type="text"
                placeholder="com.example.MyClass"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" htmlFor="lineNumber">
                Line Number
              </label>
              <input
                id="lineNumber"
                type="number"
                placeholder="42"
                value={lineNumber}
                onChange={(e) => setLineNumber(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              onClick={addBreakpointHandler}
              disabled={!sessionId}
              className="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              Add Breakpoint
            </button>
          </div>
          <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {breakpoints.map((bp, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm"
              >
                <span className="font-mono">
                  {bp.className}:{bp.line}
                </span>
                {/* Optionally, implement removal if your API supports it */}
                <button className="text-red-500 hover:text-red-600" disabled>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Debug Events Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 3l-7 7 7 7M5 5h2v14H5V5z"
              />
            </svg>
            Debug Events
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">View live events from the debugger.</p>
          <div className="max-h-64 overflow-y-auto scrollbar-thin border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
            {events.length === 0 ? (
              <div className="text-sm italic text-gray-400 dark:text-gray-500">No events yet…</div>
            ) : (
              events.map((ev, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md font-mono text-sm"
                >
                  {JSON.stringify(ev)}
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Status bar */}
      {status && (
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-red-600 dark:text-red-400">
          {status}
        </div>
      )}

      <footer className="py-6 text-center text-sm text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-600">
        © {new Date().getFullYear()} Java Debugger. Built with React and TailwindCSS.
      </footer>
    </div>
  );
}
