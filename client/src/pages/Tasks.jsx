import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request, updateTaskStatus, updateTaskPriority } from "../api";


export default function Tasks() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await request("/api/tasks", "GET", null, token);
    setLoading(false);
    if (res.success) {
      setTasks(res.data.tasks || []);
    } else {
      alert(res.error?.message || "Failed to load tasks");
    }
  };


  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const res = await request("/api/tasks", "POST", { title }, token);
    setCreating(false);

    if (res.success) {
      setTitle("");
      fetchTasks();
    } else {
      alert(res.error?.message || "Failed to create task");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchTasks();
 
  }, []);

  return (
    <div className="page page-fade-in">
      <header className="topbar">
        <div>
          <h1 className="topbar-title">Your Tasks</h1>
          <p className="topbar-subtitle">Stay on top of your work.</p>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="content">
        <section className="card">
          <form className="task-form" onSubmit={handleAddTask}>
            <div className="task-input-wrapper">
              <input
                className="input"
                placeholder="What do you want to get done today?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary task-add-button"
              type="submit"
              disabled={creating}
            >
              {creating ? "Adding..." : "Add Task"}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="section-title">Task List</h2>
          {loading ? (
            <div className="loader-wrapper">
              <div className="loader" />
              <p className="loader-text">Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <p className="empty-text">No tasks yet. Create your first task above.</p>
          ) : (
        <ul className="task-list">
  {tasks.map((task, index) => (
    <li
      key={task.id}
      className="task-item"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="task-info">
        <div className="task-title">{task.title}</div>

       
 <select
  className="dropdown"
  value={task.status}
  onChange={async (e) => {
    const newStatus = e.target.value;
    await updateTaskStatus(task.id, newStatus, token);
    fetchTasks();
  }}
>
  <option value="todo">📝 Todo</option>
  <option value="in-progress">⚙️ In Progress</option>
  <option value="completed">✅ Completed</option>
  {/* <option value="archived">📦 Archived</option> */}
</select>

        {/* Priority Dropdown */}
        <select
          className="dropdown priority"
          value={task.priority || "medium"}
          onChange={async (e) => {
            const newPriority = e.target.value;
            await updateTaskPriority(task.id, newPriority, token);
            fetchTasks();
          }}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🟠 High</option>
          <option value="urgent">🔴 Urgent</option>
        </select>
      </div>
    </li>
  ))}
</ul>
          )}
        </section>
      </main>
    </div>
  );
}
