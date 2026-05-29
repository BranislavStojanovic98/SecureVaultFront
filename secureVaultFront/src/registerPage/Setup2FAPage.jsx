import { useNavigate } from "react-router-dom";
import "./Setup2FAPage.css";

export default function Setup2FAPage() {
  const navigate = useNavigate();

  const qrCode = localStorage.getItem("qrCode");

  const handleContinue = () => {
    localStorage.removeItem("qrCode");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Scan QR Code</h2>

        {qrCode ? (
            <div className="qr-container">
                <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code"
                    className="qr-image"
                />
            </div>
        ) : (
          <p>No QR code found</p>
        )}

        <p className="qr-text">
            Scan this with Google Authenticator
        </p>

        <button onClick={handleContinue} className="auth-button">
          I have scanned it
        </button>
      </div>
    </div>
  );
}