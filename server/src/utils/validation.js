import { TASK_STATUSES, TASK_PRIORITIES } from "../constants/task.js";

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) return false;
  return /\d/.test(password);
};

export const validateTaskTitle = (title) => {
  return typeof title === "string" && title.trim().length > 0 && title.length <= 200;
};

export const validateDueDate = (dueDate) => {
  if (!dueDate) return true; // optional
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;
  return d > new Date();
};

export const isValidStatus = (status) => TASK_STATUSES.includes(status);
export const isValidPriority = (priority) => TASK_PRIORITIES.includes(priority);

export const validateStatusTransition = (from, to) => {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  if (from === "archived" && to !== "archived") return false;
  return true;
};
