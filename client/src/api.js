const API_URL = "http://localhost:4000";

export const request = async (endpoint, method = "GET", body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  return res.json();
};


export const updateTaskStatus = (id, status, token) =>
  request(`/api/tasks/${id}/status`, "PUT", { status }, token);

export const updateTaskPriority = (id, priority, token) =>
  request(`/api/tasks/${id}/priority`, "PUT", { priority }, token);
