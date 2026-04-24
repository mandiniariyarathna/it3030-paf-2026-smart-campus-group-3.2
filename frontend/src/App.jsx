import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '384649476958-c6b17p693e4kt4spnovf3qnm8danqlt0.apps.googleusercontent.com';

function GoogleSignInButton({ onCredential, onError }) {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response?.credential) {
          onError('Google did not return a valid credential.');
          return;
        }

        onCredential(response.credential);
      },
    });

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
    });
  }, [onCredential, onError]);

  return (
    <section className="google-auth" aria-label="google authentication">
      <p className="google-auth-label">Or continue with</p>
      <div className="google-auth-btn" ref={googleButtonRef} />
    </section>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleAuth = async (credential) => {
    try {
      setIsSubmitting(true);
      setError('');
      await loginWithGoogle(credential);
      navigate('/home', { replace: true });
    } catch (exception) {
      setError(exception.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="login form">
        <aside className="auth-aside">
          <p className="eyebrow">Smart Campus Platform</p>
          <h1>Welcome back.</h1>
          <p className="aside-copy">Sign in securely with Google to continue your campus work.</p>
          <ul className="benefits-list" aria-label="Platform highlights">
            <li>Role based protected access</li>
            <li>Live notification center</li>
            <li>Admin user role control</li>
          </ul>
        </aside>

        <section className="auth-panel">
          <p className="badge">Login</p>
          <h2>Access your account</h2>
          <p className="panel-copy">Use your Google account to authenticate and open your dashboard.</p>

          <button type="button" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
          </button>
          <GoogleSignInButton onCredential={handleGoogleAuth} onError={setError} />

          {error ? <p className="field-error">{error}</p> : null}
          <p className="helper-text">
            New here? <Link to="/signup" className="helper-link">View sign up details</Link>
          </p>
        </section>
      </section>
    </main>
  );
}

function SignupInfoPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="signup info">
        <aside className="auth-aside">
          <p className="eyebrow">Smart Campus Platform</p>
          <h1>Create access quickly.</h1>
          <p className="aside-copy">Use Google login once and your user profile will be created automatically.</p>
        </aside>
        <section className="auth-panel">
          <p className="badge">Sign Up</p>
          <h2>No manual registration needed</h2>
          <p className="panel-copy">Go to login and continue with Google. Your role defaults to USER.</p>
          <Link to="/login" className="helper-link">Back to login</Link>
        </section>
      </section>
    </main>
  );
}

function HomePage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="home-page">
      <section className="home-hero" aria-label="home intro">
        <div className="home-hero-copy">
          <p className="home-kicker">Smart Campus Workspace</p>
          <h1>Welcome, {user?.name || 'User'}</h1>
          <p>Manage your profile, notifications, and role-based pages from a single place.</p>
          <div className="home-actions">
            <button type="button" className="home-btn home-btn-primary" onClick={() => navigate('/home')}>
              Open Dashboard
            </button>
            {isAdmin ? (
              <button
                type="button"
                className="home-btn home-btn-outline"
                onClick={() => navigate('/admin/users')}
              >
                Manage Users
              </button>
            ) : null}
          </div>
        </div>

        <div className="home-status-card" aria-label="today summary">
          <h2>Session summary</h2>
          <ul>
            <li><span>Email</span><strong>{user?.email || '-'}</strong></li>
            <li><span>Role</span><strong>{user?.role || 'USER'}</strong></li>
            <li><span>Status</span><strong>Authenticated</strong></li>
          </ul>
        </div>
      </section>

      <nav className="home-nav-links" aria-label="session links">
        <button type="button" className="home-link-btn" onClick={handleLogout}>Sign out</button>
      </nav>
    </main>
  );
}

function AdminPlaceholderPage() {
  return (
    <main className="home-page">
      <section className="home-hero-copy">
        <p className="home-kicker">Admin Area</p>
        <h1>User management is enabled</h1>
        <p>You can now access admin protected routes. Full user management UI comes in the next step.</p>
      </section>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupInfoPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/users" element={<AdminPlaceholderPage />} />
      </Route>
    </Routes>
  );
}

export default App;
