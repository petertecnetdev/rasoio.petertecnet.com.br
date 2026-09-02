import { Link } from "react-router-dom";

const LogoutComponent = () => (
  <li>
    <Link to="/logout" className="dropdown-item">
      Sair
    </Link>
  </li>
);

export default LogoutComponent;
