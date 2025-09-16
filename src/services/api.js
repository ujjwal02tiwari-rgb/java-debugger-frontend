
import axios from "axios";
import API_BASE_URL from "../config";


export const createSession = async () => {
  return axios.post(`${API_BASE_URL}/sessions`);
};


export const launchTarget = async (target) => {
  return axios.post(`${API_BASE_URL}/launch`, { target });
};


export const addBreakpoint = async (className, line) => {
  return axios.post(`${API_BASE_URL}/breakpoints`, { className, line });
};


export const getDebugEvents = async () => {
  return axios.get(`${API_BASE_URL}/events`);
};
