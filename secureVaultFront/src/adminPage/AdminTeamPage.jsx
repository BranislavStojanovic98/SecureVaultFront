import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../crypto/AuthFetch";
import "./AdminTeamPage.css";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    authFetch("https://localhost:8080/team/allteams")
      .then((res) => {
        if (!res || !res.ok) {
          navigate("/adminhome");
          return;
        }
        return res.json();
      })
      .then((data) => setTeams(data))
      .catch(() => navigate("/"));
  }, [navigate]);

  const createTeam = async () => {
  if (!newTeamName.trim()) return;

  const response = await fetch(`https://localhost:8080/team`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      name: newTeamName,
      createdById: localStorage.getItem("userId"),
    }),
  });

  const createdTeam = await response.json();

  setShowCreateModal(false);
  setNewTeamName("");

  navigate(`/admin/teams/${createdTeam.id}`);
};

const deleteTeam = async (teamId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this team?"
  );

  if (!confirmed) return;

  await fetch(`https://localhost:8080/team/remove/${teamId}`, {
    method: "DELETE",
    credentials: "include",
  });

  setTeams((prev) =>
    prev.filter((team) => team.id !== teamId)
  );
};

  const openTeam = (teamId) => {
    navigate(`/admin/teams/${teamId}`);
  };

  return (
    <div className="teams-container">
      <div className="teams-card">
        <h1>🧩 Teams Overview</h1>

        <div className="teams-list">
          {teams.map((team) => (
            <div key={team.id} className="team-row">
              <div>
                <strong>{team.name}</strong>
                <p>{team.description}</p>
                <p>{team.id}</p>
              </div>

              <div className="team-actions">
                <button onClick={() => openTeam(team.id)}>
                  View Team
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteTeam(team.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="add-member-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Create Team
        </button>

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Create Team</h3>

              <input
                type="text"
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />

              <div className="modal-actions">
                <button onClick={createTeam}>
                  Create
                </button>

                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => navigate("/adminhome")}>
          Back
        </button>
      </div>
    </div>
  );
}