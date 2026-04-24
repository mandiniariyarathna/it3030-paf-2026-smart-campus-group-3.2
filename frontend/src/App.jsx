import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { authenticateWithGoogle } from './services/authService';

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

function AuthLayout({
  mode,
  badge,
  title,
  subtitle,
  buttonText,
  isSubmitting = false,
  helperText,
  helperLinkTo,
  helperLinkText,
  onSubmit,
  children,
}) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-label={`${mode} form`}>
        <aside className="auth-aside">
          <p className="eyebrow">Smart Campus Platform</p>
          <h1>Welcome back.</h1>
          <p className="aside-copy">
            Sign in to access your campus workspace and continue where you left off.
          </p>
          <ul className="benefits-list" aria-label="Platform highlights">
            <li>Simple, secure authentication</li>
            <li>Clean access to your dashboard</li>
            <li>Built for a modern campus workflow</li>
          </ul>
        </aside>

        <section className="auth-panel">
          <p className="badge">{badge}</p>
          <h2>{title}</h2>
          <p className="panel-copy">{subtitle}</p>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {children}
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {buttonText}
            </button>
          </form>

          <p className="helper-text">
            {helperText}{' '}
            <Link to={helperLinkTo} className="helper-link">
              {helperLinkText}
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginTouched, setLoginTouched] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validateLoginField = (fieldName, fieldValue) => {
    const trimmedValue = fieldValue.trim();

    switch (fieldName) {
      case 'email': {
        if (!trimmedValue) {
          return 'Username is required.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          return 'Enter a valid university email address.';
        }
        return '';
      }
      case 'password': {
        if (!fieldValue) {
          return 'Password is required.';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const validateLoginForm = (values) => {
    const nextErrors = {};

    Object.keys(values).forEach((fieldName) => {
      const error = validateLoginField(fieldName, values[fieldName]);
      if (error) {
        nextErrors[fieldName] = error;
      }
    });

    return nextErrors;
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (loginTouched[name]) {
      setLoginErrors((previous) => ({
        ...previous,
        [name]: validateLoginField(name, value),
      }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleLoginBlur = (event) => {
    const { name, value } = event.target;

    setLoginTouched((previous) => ({
      ...previous,
      [name]: true,
    }));

    setLoginErrors((previous) => ({
      ...previous,
      [name]: validateLoginField(name, value),
    }));
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(loginData);
    setLoginErrors(nextErrors);
    setLoginTouched({
      email: true,
      password: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please enter your username and password before signing in.');
      return;
    }

    setSubmitError('');

    const identity = loginData.email.trim();
    const displayName = identity.includes('@') ? identity.split('@')[0] : identity;

    navigate('/home', {
      state: {
        displayName: displayName || 'Student',
      },
    });
  };

  const handleGoogleAuth = async (credential) => {
    try {
      setSubmitError('');
      const response = await authenticateWithGoogle(credential);
      navigate('/home', {
        state: {
          displayName: response.displayName || 'Student',
        },
      });
    } catch (error) {
      setSubmitError(error.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <AuthLayout
      mode="login"
      badge="Login"
      title="Access your account"
      subtitle="Use your university credentials to continue."
      buttonText="Sign In"
      helperText="Don't have an account?"
      helperLinkTo="/signup"
      helperLinkText="Create one"
      onSubmit={handleLoginSubmit}
    >
      <label htmlFor="login-email">Username</label>
      <input
        id="login-email"
        type="email"
        name="email"
        placeholder="name@university.edu"
        autoComplete="email"
        value={loginData.email}
        onChange={handleLoginChange}
        onBlur={handleLoginBlur}
        aria-invalid={Boolean(loginTouched.email && loginErrors.email)}
        aria-describedby="login-email-error"
        required
      />
      {loginTouched.email && loginErrors.email ? (
        <p className="field-error" id="login-email-error">
          {loginErrors.email}
        </p>
      ) : null}

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        name="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        value={loginData.password}
        onChange={handleLoginChange}
        onBlur={handleLoginBlur}
        aria-invalid={Boolean(loginTouched.password && loginErrors.password)}
        aria-describedby="login-password-error"
        required
      />
      {loginTouched.password && loginErrors.password ? (
        <p className="field-error" id="login-password-error">
          {loginErrors.password}
        </p>
      ) : null}

      <GoogleSignInButton onCredential={handleGoogleAuth} onError={setSubmitError} />
      {submitError ? <p className="field-error">{submitError}</p> : null}
    </AuthLayout>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    lastName: '',
    username: '',
    mobileNumber: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleGoogleAuth = async (credential) => {
    try {
      setSubmitError('');
      const response = await authenticateWithGoogle(credential);
      navigate('/home', {
        state: {
          displayName: response.displayName || 'Student',
        },
      });
    } catch (error) {
      setSubmitError(error.message || 'Google sign-up failed. Please try again.');
    }
  };

  const validateField = (fieldName, fieldValue) => {
    const trimmedValue = fieldValue.trim();

    switch (fieldName) {
      case 'fullName': {
        if (!trimmedValue) {
          return 'Full name is required.';
        }
        if (!/^[A-Za-z][A-Za-z\s'-]{1,39}$/.test(trimmedValue)) {
          return 'Enter a valid full name (2-40 letters).';
        }
        return '';
      }
      case 'lastName': {
        if (!trimmedValue) {
          return 'Last name is required.';
        }
        if (!/^[A-Za-z][A-Za-z\s'-]{1,39}$/.test(trimmedValue)) {
          return 'Enter a valid last name (2-40 letters).';
        }
        return '';
      }
      case 'username': {
        if (!trimmedValue) {
          return 'Username is required.';
        }
        if (!/^[A-Za-z0-9._]{3,20}$/.test(trimmedValue)) {
          return 'Use 3-20 letters, numbers, dots or underscores.';
        }
        return '';
      }
      case 'mobileNumber': {
        if (!trimmedValue) {
          return 'Mobile number is required.';
        }
        if (!/^\+?[0-9]{10,15}$/.test(trimmedValue)) {
          return 'Use 10-15 digits (optional + prefix).';
        }
        return '';
      }
      case 'email': {
        if (!trimmedValue) {
          return 'Email address is required.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          return 'Enter a valid email address.';
        }
        return '';
      }
      case 'password': {
        if (!fieldValue) {
          return 'Password is required.';
        }
        if (fieldValue.length < 8) {
          return 'Password must be at least 8 characters.';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(fieldValue)) {
          return 'Use upper, lower, number and special character.';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const validateForm = (values) => {
    const nextErrors = {};

    Object.keys(values).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        nextErrors[fieldName] = error;
      }
    });

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (touched[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: validateField(name, value),
      }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value),
    }));
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(formData);
    setErrors(nextErrors);
    setTouched({
      fullName: true,
      lastName: true,
      username: true,
      mobileNumber: true,
      email: true,
      password: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields and submit again.');
      return;
    }

    setSubmitError('');

    navigate('/home', {
      state: {
        displayName: formData.fullName.trim() || formData.username.trim() || 'Student',
      },
    });
  };

  return (
    <AuthLayout
      mode="signup"
      badge="Sign Up"
      title="Create your account"
      subtitle="Register once to unlock the Smart Campus experience."
      buttonText="Create Account"
      helperText="Already have an account?"
      helperLinkTo="/login"
      helperLinkText="Sign in"
      onSubmit={handleSignupSubmit}
    >
      <label htmlFor="signup-full-name">Full Name</label>
      <input
        id="signup-full-name"
        type="text"
        name="fullName"
        placeholder="Enter your full name"
        autoComplete="name"
        value={formData.fullName}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.fullName && errors.fullName)}
        aria-describedby="signup-full-name-error"
      />
      {touched.fullName && errors.fullName ? (
        <p className="field-error" id="signup-full-name-error">
          {errors.fullName}
        </p>
      ) : null}

      <label htmlFor="signup-last-name">Last Name</label>
      <input
        id="signup-last-name"
        type="text"
        name="lastName"
        placeholder="Enter your last name"
        autoComplete="family-name"
        value={formData.lastName}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.lastName && errors.lastName)}
        aria-describedby="signup-last-name-error"
      />
      {touched.lastName && errors.lastName ? (
        <p className="field-error" id="signup-last-name-error">
          {errors.lastName}
        </p>
      ) : null}

      <label htmlFor="signup-username">Username</label>
      <input
        id="signup-username"
        type="text"
        name="username"
        placeholder="Choose a username"
        autoComplete="username"
        value={formData.username}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.username && errors.username)}
        aria-describedby="signup-username-error"
      />
      {touched.username && errors.username ? (
        <p className="field-error" id="signup-username-error">
          {errors.username}
        </p>
      ) : null}

      <label htmlFor="signup-mobile">Mobile Number</label>
      <input
        id="signup-mobile"
        type="tel"
        name="mobileNumber"
        placeholder="e.g. +94771234567"
        autoComplete="tel"
        value={formData.mobileNumber}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.mobileNumber && errors.mobileNumber)}
        aria-describedby="signup-mobile-error"
      />
      {touched.mobileNumber && errors.mobileNumber ? (
        <p className="field-error" id="signup-mobile-error">
          {errors.mobileNumber}
        </p>
      ) : null}

      <label htmlFor="signup-email">Email Address</label>
      <input
        id="signup-email"
        type="email"
        name="email"
        placeholder="name@example.com"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.email && errors.email)}
        aria-describedby="signup-email-error"
      />
      {touched.email && errors.email ? (
        <p className="field-error" id="signup-email-error">
          {errors.email}
        </p>
      ) : null}

      <label htmlFor="signup-password">Password</label>
      <input
        id="signup-password"
        type="password"
        name="password"
        placeholder="Create a secure password"
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.password && errors.password)}
        aria-describedby="signup-password-error"
      />
      {touched.password && errors.password ? (
        <p className="field-error" id="signup-password-error">
          {errors.password}
        </p>
      ) : null}

      <GoogleSignInButton onCredential={handleGoogleAuth} onError={setSubmitError} />

      {submitError ? <p className="field-error">{submitError}</p> : null}
    </AuthLayout>
  );
}

function HomePage() {
  const location = useLocation();
  const displayName = location.state?.displayName || 'Student';

  return (
    <main className="home-page">
      <section className="home-hero" aria-label="home intro">
        <div className="home-hero-copy">
          <p className="home-kicker">Smart Campus Workspace</p>
          <h1>Welcome, {displayName}</h1>
          <p>
            Manage academics, campus services, and your daily tasks in one professional dashboard
            experience.
          </p>
          <div className="home-actions">
            <button type="button" className="home-btn home-btn-primary">
              Open Dashboard
            </button>
            <button type="button" className="home-btn home-btn-outline">
              View Announcements
            </button>
          </div>
        </div>

        <div className="home-status-card" aria-label="today summary">
          <h2>Today at a glance</h2>
          <ul>
            <li>
              <span>Classes</span>
              <strong>3 scheduled</strong>
            </li>
            <li>
              <span>Tasks due</span>
              <strong>2 pending</strong>
            </li>
            <li>
              <span>Library slots</span>
              <strong>1 reserved</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="home-grid" aria-label="quick services">
        <article className="home-tile">
          <h3>Academic Planner</h3>
          <p>Track lectures, assignment deadlines, and exam preparation milestones.</p>
        </article>
        <article className="home-tile">
          <h3>Transport Updates</h3>
          <p>Check shuttle timings and route updates before heading across campus.</p>
        </article>
        <article className="home-tile">
          <h3>Student Support</h3>
          <p>Access advisory services, health resources, and important guidance quickly.</p>
        </article>
      </section>

      <nav className="home-nav-links" aria-label="session links">
        <Link to="/login">Sign out</Link>
        <Link to="/signup">Create another account</Link>
      </nav>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  );
}

export default App;
