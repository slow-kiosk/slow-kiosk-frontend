import { Link } from "react-router-dom";

const Nav = () => {
  return (
    <nav className="flex gap-4 p-4 bg-gray-200">
      <Link to="/kiosk">Kiosk</Link>
      <Link to="/ordering">Ordering</Link>
      <Link to="/discount">Discount</Link>
      <Link to="/payment">Payment</Link>
    </nav>
  );
};

export default Nav;
