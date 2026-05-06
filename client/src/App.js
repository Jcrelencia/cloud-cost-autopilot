import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [accountId, setAccountId] = useState(null);
  const [accountName, setAccountName] = useState('');

  const handleLoginSuccess = (id, name) => {
    setAccountId(id);
    setAccountName(name);
  };

  const handleLogout = () => {
    setAccountId(null);
    setAccountName('');
  };

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