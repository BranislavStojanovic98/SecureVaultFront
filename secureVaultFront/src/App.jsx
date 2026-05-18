import { Routes, Route } from "react-router-dom";

import LoginPage from "./loginPage/LoginPage.jsx";
import HomePage from "./homePage/HomePage";
import TwoFactorPage from "./loginPage/TwoFactorPage.jsx";
import RegisterPage from "./registerPage/RegisterPage.jsx";
import Setup2FAPage from "./registerPage/Setup2FAPage.jsx";
import CreateSecretPage from "./secretsPage/CreateSecretPage.jsx";
import MySecretsPage from "./secretsPage/MySecretsPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminPage from "./adminPage/AdminPage.jsx";
import DeveloperPage from "./homePage/DeveloperPage.jsx";
import AdminUsersPage from "./adminPage/AdminUsersPage.jsx";
import AdminTeamsPage from "./adminPage/AdminTeamPage.jsx";
import AdminTeamDetailsPage from "./adminPage/AdminTeamDetailsPage.jsx";
import SecretRotationPage from "./secretsPage/SecretRotationPage.jsx";
import AdminAuditLogsPage from "./adminPage/AdminAuditLogsPage.jsx";


export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/2fa" element={<TwoFactorPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/setup-2fa" element={<Setup2FAPage />} />

      {/* PROTECTED (all logged-in users) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-secret" element={<CreateSecretPage />} />
        <Route path="/my-secrets" element={<MySecretsPage />} />
        <Route path="/my-secrets/rotate" element={<SecretRotationPage />} />
      </Route>

      {/* ADMIN ONLY */}
      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route path="/adminhome" element={<AdminPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/teams" element={<AdminTeamsPage />} />
        <Route path="/admin/teams/:teamId" element={<AdminTeamDetailsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* DEVELOPER ONLY */}
      <Route element={<ProtectedRoute role="DEVELOPER" />}>
        <Route path="/developerhome" element={<DeveloperPage />} />
      </Route>
    </Routes>
  );
}