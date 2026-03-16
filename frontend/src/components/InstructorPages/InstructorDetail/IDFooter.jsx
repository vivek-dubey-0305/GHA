import { Link } from "react-router-dom";

export default function IDFooter() {
  return (
    <footer className="id-footer">
      <Link to="/" className="id-footer-logo">GHA</Link>
      <span className="id-footer-copy">© 2025 GHA · All rights reserved</span>
    </footer>
  );
}
