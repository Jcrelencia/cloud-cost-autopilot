import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

const SESSION_KEY = 'cca_session';
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes in ms

function App() {
  const [accountId, setAccountId] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [checking, setChecking] = useState(true);

  // On load, check if there is a valid saved session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const { id, name, timestamp } = JSON.parse(saved);
        const age = Date.now() - timestamp;
        if (age < SESSION_DURATION) {
          setAccountId(id);
          setAccountName(name);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setChecking(false);
    }
  }, []);

  const handleLoginSuccess = (id, name) => {
    setAccountId(id);
    setAccountName(name);
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id,
      name,
      timestamp: Date.now(),
    }));
  };

  const handleLogout = () => {
    setAccountId(null);
    setAccountName('');
    localStorage.removeItem(SESSION_KEY);
  };

  if (checking) return null;

  return (
    <div className="app">
      {!accountId ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard accountId={accountId} accountName={accountName} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;