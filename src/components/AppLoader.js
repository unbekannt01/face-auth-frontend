import "./loader.css";

export default function Loader() {
  return (
    <div className="loader-overlay">
      <div className="scanner-box">
        <div className="cyber-ring"></div>
        <div className="inner-ring"></div>

        <div className="face-core">
          <span className="glow-dot"></span>
        </div>

        <div className="scan-bar"></div>
      </div>

      <p className="scan-text">Verifying Identity...</p>
      <p className="scan-sub">Biometric Authentication in Progress</p>
    </div>
  );
}
