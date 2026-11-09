import { useCallback, useEffect, useState } from 'react';
import { api, getToken, clearToken } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import ReadingForm from './components/ReadingForm.jsx';
import ReadingsList from './components/ReadingsList.jsx';
import Reports from './components/Reports.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  // If a token is saved from last time, check it is still valid.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  if (checking) return <p className="muted center">Loading…</p>;
  if (!user) return <AuthForm onAuthed={setUser} />;
  return <Dashboard user={user} onLogout={logout} />;
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('readings');
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0); // bump to refresh reports after a change

  const load = useCallback(async (p) => {
    try {
      setLoadError('');
      setList(await api.listReadings(p, 10));
    } catch (err) {
      if (err.status === 401) onLogout();
      else setLoadError(err.message);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load(page);
  }, [page, load]);

  function changed() {
    setVersion((v) => v + 1);
    // If we just deleted the last row of the final page, step back a page.
    if (list && list.readings.length === 1 && page > 1) setPage(page - 1);
    else load(page);
  }

  async function addReading(values) {
    await api.addReading(values);
    setPage(1);
    setVersion((v) => v + 1);
    await load(1);
  }

  return (
    <div className="app">
      <header>
        <h1 className="brand">🩸 Sweety</h1>
        <div className="who">
          <span className="muted">Hi, {user.name}</span>
          <button type="button" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'readings'} className={tab === 'readings' ? 'active' : ''} onClick={() => setTab('readings')}>
          Readings
        </button>
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
          Reports
        </button>
      </nav>

      {tab === 'readings' ? (
        <>
          <section className="card">
            <h2>Add a reading</h2>
            <ReadingForm onSubmit={addReading} />
          </section>
          <section className="card">
            <h2>Your readings</h2>
            {loadError && <p className="error" role="alert">{loadError}</p>}
            <ReadingsList data={list} onChanged={changed} onPage={setPage} />
          </section>
        </>
      ) : (
        <Reports refreshKey={version} />
      )}
    </div>
  );
}
