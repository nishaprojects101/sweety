import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data =
        mode === 'login'
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form);
      setToken(data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1 className="brand">🩸 Sweety</h1>
        <p className="muted">Track your blood glucose, one reading at a time.</p>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <label>
              Name
              <input value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'register' && <p className="hint">At least 8 characters.</p>}

          {error && <p className="error" role="alert">{error}</p>}

          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="switch">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
