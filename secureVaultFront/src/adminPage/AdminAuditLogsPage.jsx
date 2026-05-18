import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../crypto/axios";
import "./AdminAuditLogsPage.css";
import useAdminAlerts from "../crypto/AdminAlert";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useAdminAlerts();

  const [currentPage, setCurrentPage] = useState(1);

  const logsPerPage = 10;

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;

  const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

  const currentLogs = sortedLogs.slice(
        indexOfFirstLog,
        indexOfLastLog
    );

  const totalPages = Math.ceil(logs.length / logsPerPage);

  useEffect(() => {
    api.get("/audit/audit-logs")
      .then((res) => {
        setLogs(res.data);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load audit logs.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="audit-card">
      <h1>📜 Audit Logs</h1>

      <button onClick={() => navigate("/adminhome")}>
        ← Back
      </button>

      {loading && <p>Loading...</p>}

      {!loading && logs.length === 0 && (
        <p>No audit logs found.</p>
      )}

      {!loading && logs.length > 0 && (
        <>
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Payload</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {currentLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={
                      log.decryptedPayload?.includes("HONEYTOKEN")
                        ? "danger-row"
                        : ""
                    }
                  >
                    <td>{log.id}</td>
                    <td>{log.decryptedPayload}</td>
                    <td>
                      {new Date(
                        log.createdAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn secondary"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => prev - 1)
                }
              >
                ← Previous
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="btn secondary"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => prev + 1)
                }
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}