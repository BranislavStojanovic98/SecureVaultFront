import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./loginPage/LoginPage.jsx";
import HomePage from "./homePage/HomePage";
import TwoFactorPage from "./loginPage/TwoFactorPage.jsx";
import RegisterPage from "./registerPage/RegisterPage.jsx";
import Setup2FAPage from "./registerPage/Setup2FAPage.jsx";
import UnlockVaultPage from "./loginPage/UnlockVaultPage.jsx";
import CreateSecretPage from "./secretsPage/CreateSecretPage.jsx";
import MySecretsPage from "./secretsPage/MySecretsPage.jsx";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/2fa" element={<TwoFactorPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/setup-2fa" element={<Setup2FAPage />} /> 
      <Route path="/unlockVault" element={<UnlockVaultPage />} />
      <Route path="/create-secret" element={<CreateSecretPage />} />
      <Route path="/my-secrets" element={<MySecretsPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}