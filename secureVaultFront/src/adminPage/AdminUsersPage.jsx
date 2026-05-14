import "./AdminUsersPage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    role: "",
  });

  const navigate = useNavigate();

  const activateUser = async (id) => {
  await fetch(`http://localhost:8080/user/activate/${id}`, {
    method: "PUT",
    credentials: "include",
  });

  fetchUsers();
};

const deactivateUser = async (id) => {
  await fetch(`http://localhost:8080/user/deactivate/${id}`, {
    method: "PUT",
    credentials: "include",
  });

  fetchUsers();
};

const freezeUser = async (id) => {
  await fetch(`http://localhost:8080/user/freeze/${id}`, {
    method: "PUT",
    credentials: "include",
  });

  fetchUsers();
};

const unfreezeUser = async (id) => {
  await fetch(`http://localhost:8080/user/unfreeze/${id}`, {
    method: "PUT",
    credentials: "include",
  });

  fetchUsers();
};

  useEffect(() => {
  const loadUsers = async () => {
    try {
      const res = await fetch("http://localhost:8080/user/everyone", {
        credentials: "include",
      });

      if (!res.ok) {
        navigate("/adminhome");
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
        alert.call(err);
        navigate("/");
    }
  };

  loadUsers();
}, [navigate]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8080/user/everyone", {
        credentials: "include",
      });

      if (!res.ok) {
        navigate("/adminhome");
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
        alert.call(err);
      navigate("/");
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      role: user.role,
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData({ username: "", role: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveUser = async (id) => {
    await fetch(`http://localhost:8080/user/edit/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    cancelEdit();
    fetchUsers();
  };

  return (
    <div className="admin-users-container">
      <div className="admin-users-card">
        <h1>👥 User Management</h1>

        <div className="user-list">
          {users.map((user) => (
            <div key={user.id} className="user-row">
              {editingUserId === user.id ? (
                <div className="edit-form">
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                  />

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="TEAM_LEAD">TEAM LEAD</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <button onClick={() => saveUser(user.id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <div className="user-info">
                  {/* LEFT SIDE */}
                  <div className="user-left">
                    <div className="user-details">
                      <strong>{user.username}</strong>
                      <p>{user.role === "TEAM_LEAD" ? "TEAM LEAD" : user.role}</p>

                      <small>
                        Status: {user.active ? "Active" : "Inactive"} |{" "}
                        {user.frozen ? "Frozen" : "Unfrozen"}
                      </small>
                    </div>

                    <div className="user-actions">
                      {user.active ? (
                        <button onClick={() => deactivateUser(user.id)}>
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => activateUser(user.id)}>
                          Activate
                        </button>
                      )}

                      {user.frozen ? (
                        <button onClick={() => unfreezeUser(user.id)}>
                          Unfreeze
                        </button>
                      ) : (
                        <button onClick={() => freezeUser(user.id)}>
                          Freeze
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="user-right">
                    <button className="edit-btn" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="back-btn" onClick={() => navigate("/adminhome")}>
          Back
        </button>
      </div>
    </div>
  );
}