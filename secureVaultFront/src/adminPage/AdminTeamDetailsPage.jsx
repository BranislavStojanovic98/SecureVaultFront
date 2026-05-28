import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../crypto/AuthFetch";
import "./AdminTeamDetailsPage.css";

export default function AdminTeamDetailsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("MEMBER");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editRole, setEditRole] = useState("MEMBER");
    

  useEffect(() => {
    if (!teamId) return;

    authFetch(`https://localhost:8080/team/teamno/${teamId}`)
      .then((res) => res.json())
      .then((data) => setTeam(data));

    authFetch(`https://localhost:8080/teamMember/getTeammatesFor/${teamId}`)
      .then((res) => res.json())
      .then((data) => setMembers(data));

    authFetch(`https://localhost:8080/user/everyone`)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, [teamId]);

  const addMember = async () => {
    if (!selectedUserId) return;

    await fetch(`https://localhost:8080/teamMember/addmember`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        teamId: Number(teamId),
        userId: selectedUserId,
        role: selectedRole,
        joinedAt: null,
      }),
    });

    setSelectedUserId(null);
    setSelectedRole("MEMBER");
    setShowAddModal(false);

    refreshMembers();
  };

  const removeMember = async (userId) => {
    await fetch(`https://localhost:8080/teamMember/remove`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        teamId: Number(teamId),
        userId: userId,
      }),
    });

    refreshMembers();
  };

  const updateMemberRole = async () => {
  if (!editingMember) return;

  await fetch(`https://localhost:8080/teamMember/edit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      teamId: Number(teamId),
      userId: editingMember.userId,
      role: editRole,
    }),
  });

  setShowEditModal(false);
  setEditingMember(null);
  setEditRole("MEMBER");

  refreshMembers();
};

  const refreshMembers = () => {
    authFetch(`https://localhost:8080/teamMember/getTeammatesFor/${teamId}`)
      .then((res) => res.json())
      .then((data) => setMembers(data));
  };

  if (!team) return <p>Loading...</p>;

  return (
    <div className="team-details-container">
      <div className="team-details-card">
        <h1>🧩 {team.name}</h1>

        <h3>👥 Members</h3>

        <div className="members-list">
          {members.length === 0 ? (
            <p>No members in this team</p>
          ) : (
            members.map((m, index) => {
              const user = users.find((u) => u.id === m.userId);

              return (
                <div
                  key={m.userId ?? index}
                  className="member-row"
                >
                  <div>
                    <span>
                      {user ? user.username : `User #${m.userId}`}
                    </span>

                    <small style={{ display: "block", opacity: 0.7 }}>
                      {m.role} • {m.joinedAt
                        ? new Date(m.joinedAt).toLocaleDateString()
                        : ""}
                    </small>
                  </div>

                  <div className="member-actions">
                    <button
                      onClick={() => {
                        setEditingMember(m);
                        setEditRole(m.role);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>

                    <button onClick={() => removeMember(m.userId)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          className="add-member-btn"
          onClick={() => setShowAddModal(true)}
        >
          Add Member
        </button>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Add Member</h3>

              <select
                value={selectedUserId ?? ""}
                onChange={(e) =>
                  setSelectedUserId(Number(e.target.value))
                }
              >
                <option value="" disabled>
                  Select User
                </option>

                {users
                  .filter(
                    (u) =>
                      !members.some((m) => m.userId === u.id)
                  )
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="LEAD">LEAD</option>
              </select>

              <div className="modal-actions">
                <button onClick={addMember}>Add</button>

                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUserId(null);
                    setSelectedRole("MEMBER");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-card"> 
              <h3>Edit Team Role</h3>

              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="LEAD">LEAD</option>
              </select>

              <div className="modal-actions">
                <button onClick={updateMemberRole}>
                  Save
                </button>

                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setEditRole("MEMBER");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => navigate("/admin/teams")}>
          Back
        </button>
      </div>
    </div>
  );
}