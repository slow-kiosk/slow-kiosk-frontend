import { Link } from "react-router-dom";
import '../styles/App.css';

const Nav = () => {
  // 개발 모드에서만 네비게이션 표시
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <nav className="dev-nav">
      <Link to="/kiosk">Kiosk</Link>
      <Link to="/ordering">Ordering</Link>
      <Link to="/order-list">OrderListView</Link>
      <Link to="/checkout">Checkout</Link>
      <Link to="/payment">Payment</Link>
    </nav>
  );
};

export default Nav;
