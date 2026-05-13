import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { countryFlag } from '../utils/format';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/transfer', label: 'Transfer' },
    { to: '/history', label: 'History' },
    { to: '/accounts', label: 'Accounts' },
  ];

  return (
    <div className="app-layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/dashboard" className="logo">
            <span className="logo-mark">B</span>
            <span className="logo-text">Badori</span>
          </Link>
          <nav className="nav">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link${location.pathname === l.to ? ' active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="header-user">
            {user && (
              <>
                <span className="user-flag">{countryFlag(user.country)}</span>
                <span className="user-name">{user.full_name.split(' ')[0]}</span>
              </>
            )}
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <p>© 2024 Badori Bank · Rwanda 🇷🇼 &amp; Djibouti 🇩🇯 · All rights reserved</p>
      </footer>
    </div>
  );
}
