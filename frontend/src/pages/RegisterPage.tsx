import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    country: 'RW',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        country: form.country,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-logo">
          <span className="logo-mark">B</span>
          <span className="logo-text">Badori</span>
        </div>
        <h2>Open your account</h2>
        <p className="auth-subtitle">Available in Rwanda and Djibouti</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert--error">{error}</div>}

          <div className="form-group">
            <label>Country</label>
            <div className="country-select">
              {(['RW', 'DJ'] as const).map(c => (
                <label key={c} className={`country-option${form.country === c ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="country"
                    value={c}
                    checked={form.country === c}
                    onChange={() => update('country', c)}
                  />
                  <span className="country-flag">{c === 'RW' ? '🇷🇼' : '🇩🇯'}</span>
                  <span className="country-label">{c === 'RW' ? 'Rwanda (RWF)' : 'Djibouti (DJF)'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                placeholder="Amara Nkurunziza"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder={form.country === 'RW' ? '+250 7XX XXX XXX' : '+253 7X XXX XXX'}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={e => update('confirm_password', e.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
