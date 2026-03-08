import { Link, useLocation } from "react-router-dom";
import { Bot, Network, Home, FileSpreadsheet, User, ShoppingBag, Brain } from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/network", label: "Network", icon: Network },
  { path: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { path: "/agent", label: "Agent", icon: Brain },
  { path: "/formatter", label: "Formatter", icon: FileSpreadsheet },
  { path: "/profile/aria-7", label: "Profile", icon: User },
];

const TopNav = () => {
  const location = useLocation();

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, width: "100%", borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Bot style={{ width: 22, height: 22, color: "#1a1a1a" }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: "#1a1a1a", letterSpacing: -0.3 }}>
            SynthNet
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1a1a1a" : "#6b7280",
                  textDecoration: "none",
                  borderBottom: isActive ? "2px solid #1a1a1a" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 0.15s",
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
