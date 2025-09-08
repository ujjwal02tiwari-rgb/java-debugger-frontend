// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // but App.js must also avoid JSX

createRoot(document.getElementById("root")).render(
  React.createElement(App)
);
