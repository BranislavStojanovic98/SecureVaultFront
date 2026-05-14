import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../crypto/AuthFetch";
import "./AdminTeamPage.css";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    authFetch("http://localhost:8080/team/allteams")
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

              <button onClick={() => openTeam(team.id)}>
                View Team
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/adminhome")}>
          Back
        </button>
      </div>
    </div>
  );
}