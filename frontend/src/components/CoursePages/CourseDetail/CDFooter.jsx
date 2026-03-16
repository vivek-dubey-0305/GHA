import { Link } from "react-router-dom";

export default function CDFooter() {
  return (
    <footer className="cd-footer">
      <Link to="/" className="cd-footer-logo">GHA</Link>
      <div className="cd-footer-copy">© 2025 GHA · All rights reserved</div>
    </footer>
  );
}
