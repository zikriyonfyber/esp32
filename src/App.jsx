import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import UserApp from "./UserApp";
import AdminApp from "./AdminApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserApp />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      Page not found. <Link to="/">Go to the station dashboard</Link>.
    </div>
  );
}
