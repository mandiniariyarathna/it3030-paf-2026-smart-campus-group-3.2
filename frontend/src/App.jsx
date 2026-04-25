import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { authenticateWithGoogle } from './services/authService';
import ResourcesPage from './pages/ResourcesPage';
import ResourceDetailPage from './pages/ResourceDetailPage';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '384649476958-c6b17p693e4kt4spnovf3qnm8danqlt0.apps.googleusercontent.com';

const ROLE_USER = 'user';
const ROLE_TECHNICIAN = 'technician';
const ROLE_ADMIN = 'admin';

const ACCOUNT_STORAGE_KEY = 'smart-campus-accounts';
const SESSION_STORAGE_KEY = 'smart-campus-session';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@1234';

const ROLE_OPTIONS = [
  { value: ROLE_USER, label: 'User' },
  { value: ROLE_TECHNICIAN, label: 'Technician' },
];

const ROLE_LABELS = {
  [ROLE_USER]: 'User',
  [ROLE_TECHNICIAN]: 'Technician',
  [ROLE_ADMIN]: 'Admin',
};

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readStoredJson(key, fallbackValue) {
  if (!canUseStorage()) {
    return fallbackValue;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeStoredJson(key, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getStoredAccounts() {
  return readStoredJson(ACCOUNT_STORAGE_KEY, []);
}

function saveAccounts(accounts) {
  writeStoredJson(ACCOUNT_STORAGE_KEY, accounts);
}

function getStoredSession() {
  return readStoredJson(SESSION_STORAGE_KEY, null);
}

function saveSession(session) {
  writeStoredJson(SESSION_STORAGE_KEY, session);
}

function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function createDisplayName(account) {
  const combinedName = [account.fullName, account.lastName].filter(Boolean).join(' ').trim();
  return combinedName || account.username || 'Student';
}

function createSessionFromAccount(account) {
  return {
    role: account.role,
    displayName: account.displayName,
    email: account.email,
    username: account.username,
  };
}

function findAccountByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return getStoredAccounts().find((account) => account.email.toLowerCase() === normalizedEmail);
}

function findAccountByCredentials(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  return getStoredAccounts().find(
    (account) =>
      (account.email.toLowerCase() === normalizedIdentifier ||
        account.username.toLowerCase() === normalizedIdentifier) &&
      account.password === password,
  );
}

function saveAccount(account) {
  const accounts = getStoredAccounts();
  const duplicateAccount = accounts.find(
    (existingAccount) =>
      existingAccount.email.toLowerCase() === account.email.toLowerCase() ||
      existingAccount.username.toLowerCase() === account.username.toLowerCase(),
  );

  if (duplicateAccount) {
    throw new Error('An account with this email or username already exists.');
  }

  accounts.push(account);
  saveAccounts(accounts);
}

function getSessionRedirectPath(session) {
  if (!session) {
    return '/login';
  }

  return session.role === ROLE_ADMIN ? '/admin' : '/home';
}

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
  badge,
  title,
  subtitle,
  buttonText,
  isSubmitting = false,
  helperText,
  helperLinkTo,
  helperLinkText,
  secondaryActionText,
  secondaryActionTo,
  secondaryActionLinkText,
  eyebrow = 'Smart Campus Platform',
  asideTitle = 'Welcome back.',
  asideCopy,
  highlights,
  onSubmit,
  children,
}) {
  const highlightItems =
    highlights || [
      'Simple, secure authentication',
      'Clean access to your dashboard',
      'Built for a modern campus workflow',
    ];

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="authentication form">
        <aside className="auth-aside">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{asideTitle}</h1>
          <p className="aside-copy">
            {asideCopy || 'Sign in to access your campus workspace and continue where you left off.'}
          </p>
          <ul className="benefits-list" aria-label="Platform highlights">
            {highlightItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
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

          {secondaryActionText && secondaryActionTo && secondaryActionLinkText ? (
            <p className="helper-text helper-text-secondary">
              {secondaryActionText}{' '}
              <Link to={secondaryActionTo} className="helper-link">
                {secondaryActionLinkText}
              </Link>
            </p>
          ) : null}

          {helperText && helperLinkTo && helperLinkText ? (
            <p className="helper-text">
              {helperText}{' '}
              <Link to={helperLinkTo} className="helper-link">
                {helperLinkText}
              </Link>
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginTouched, setLoginTouched] = useState({});
  const [submitError, setSubmitError] = useState(location.state?.notice || '');

  const validateLoginField = (fieldName, fieldValue) => {
    const trimmedValue = fieldValue.trim();

    switch (fieldName) {
      case 'email': {
        if (!trimmedValue) {
          return 'Username or email is required.';
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

    const isAdminCredentialMatch =
      loginData.email.trim() === ADMIN_USERNAME && loginData.password === ADMIN_PASSWORD;

    if (isAdminCredentialMatch) {
      const adminSession = {
        role: ROLE_ADMIN,
        displayName: 'Administrator',
        username: ADMIN_USERNAME,
        email: `${ADMIN_USERNAME}@smartcampus.local`,
      };

      saveSession(adminSession);
      navigate('/admin', {
        state: {
          displayName: adminSession.displayName,
          role: adminSession.role,
        },
      });
      return;
    }

    const account = findAccountByCredentials(loginData.email, loginData.password);

    if (!account) {
      setSubmitError('No matching account was found.');
      return;
    }

    if (account.role === ROLE_ADMIN) {
      setSubmitError('Admin accounts must sign in from the admin access page.');
      return;
    }

    const session = createSessionFromAccount(account);
    saveSession(session);
    navigate('/home', {
      state: {
        displayName: account.displayName,
        role: account.role,
      },
    });
  };

  const handleGoogleAuth = async (credential) => {
    try {
      setSubmitError('');
      const response = await authenticateWithGoogle(credential);
      const matchedAccount = response.email ? findAccountByEmail(response.email) : null;
      const role = matchedAccount?.role || ROLE_USER;
      const displayName =
        response.displayName || matchedAccount?.displayName || response.email?.split('@')[0] || 'Campus User';

      saveSession({
        role,
        displayName,
        email: response.email || matchedAccount?.email || '',
        username: matchedAccount?.username || '',
      });

      navigate('/home', {
        state: {
          displayName,
          role,
        },
      });
    } catch (error) {
      setSubmitError(error.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <AuthLayout
      badge="Login"
      title="Access your account"
      subtitle="Use your university credentials to continue."
      buttonText="Sign In"
      helperText="Don't have an account?"
      helperLinkTo="/signup"
      helperLinkText="Create one"
      secondaryActionText="Need admin access?"
      secondaryActionTo="/admin-login"
      secondaryActionLinkText="Open admin sign in"
      asideTitle="Welcome back."
      asideCopy="Sign in to access your campus workspace and continue where you left off."
      onSubmit={handleLoginSubmit}
    >
      <label htmlFor="login-email">Username</label>
      <input
        id="login-email"
        type="text"
        name="email"
        placeholder="username or email"
        autoComplete="username"
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
    role: ROLE_USER,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleGoogleAuth = async (credential) => {
    try {
      setSubmitError('');
      const response = await authenticateWithGoogle(credential);
      const displayName = response.displayName || response.email?.split('@')[0] || 'Campus User';

      saveSession({
        role: ROLE_USER,
        displayName,
        email: response.email || '',
        username: response.email?.split('@')[0] || '',
      });

      navigate('/home', {
        state: {
          displayName,
          role: ROLE_USER,
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
      case 'role': {
        if (![ROLE_USER, ROLE_TECHNICIAN].includes(fieldValue)) {
          return 'Choose User or Technician.';
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

  const handleSignupSubmit = (event) => {
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
      role: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields and submit again.');
      return;
    }

    try {
      const account = {
        fullName: formData.fullName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        displayName: createDisplayName(formData),
      };

      saveAccount(account);
      saveSession(createSessionFromAccount(account));

      navigate('/home', {
        state: {
          displayName: account.displayName,
          role: account.role,
        },
      });
    } catch (error) {
      setSubmitError(error.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <AuthLayout
      badge="Sign Up"
      title="Create your account"
      subtitle="Register once to unlock the Smart Campus experience as a User or Technician."
      buttonText="Create Account"
      helperText="Already have an account?"
      helperLinkTo="/login"
      helperLinkText="Sign in"
      asideTitle="Join the platform."
      asideCopy="Pick the role that matches your campus work. Admin access is managed separately and is not available here."
      highlights={[
        'Register as a User or Technician',
        'Keep campus access organized by role',
        'Admin accounts stay restricted',
      ]}
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

      <label htmlFor="signup-role">Account Role</label>
      <select
        id="signup-role"
        name="role"
        value={formData.role}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(touched.role && errors.role)}
        aria-describedby="signup-role-help signup-role-error"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="field-help" id="signup-role-help">
        Choose the role for this account. Admin access is created separately.
      </p>
      {touched.role && errors.role ? (
        <p className="field-error" id="signup-role-error">
          {errors.role}
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

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
  });
  const [adminErrors, setAdminErrors] = useState({});
  const [adminTouched, setAdminTouched] = useState({});
  const [submitError, setSubmitError] = useState(location.state?.notice || '');

  const validateAdminField = (fieldName, fieldValue) => {
    switch (fieldName) {
      case 'username':
        return fieldValue.trim() ? '' : 'Admin username is required.';
      case 'password':
        return fieldValue ? '' : 'Admin password is required.';
      default:
        return '';
    }
  };

  const handleAdminChange = (event) => {
    const { name, value } = event.target;

    setAdminData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (adminTouched[name]) {
      setAdminErrors((previous) => ({
        ...previous,
        [name]: validateAdminField(name, value),
      }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const handleAdminBlur = (event) => {
    const { name, value } = event.target;

    setAdminTouched((previous) => ({
      ...previous,
      [name]: true,
    }));

    setAdminErrors((previous) => ({
      ...previous,
      [name]: validateAdminField(name, value),
    }));
  };

  const handleAdminSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {
      username: validateAdminField('username', adminData.username),
      password: validateAdminField('password', adminData.password),
    };

    Object.keys(nextErrors).forEach((fieldName) => {
      if (!nextErrors[fieldName]) {
        delete nextErrors[fieldName];
      }
    });

    setAdminErrors(nextErrors);
    setAdminTouched({
      username: true,
      password: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fill in the admin credentials.');
      return;
    }

    if (adminData.username.trim() !== ADMIN_USERNAME || adminData.password !== ADMIN_PASSWORD) {
      setSubmitError('Invalid admin credentials. Use the administrator sign in.');
      return;
    }

    const session = {
      role: ROLE_ADMIN,
      displayName: 'Administrator',
      username: ADMIN_USERNAME,
      email: `${ADMIN_USERNAME}@smartcampus.local`,
    };

    saveSession(session);
    navigate('/admin', {
      state: {
        displayName: session.displayName,
        role: session.role,
      },
    });
  };

  return (
    <AuthLayout
      badge="Admin Access"
      title="Administrator sign in"
      subtitle="Restricted access for campus administrators only."
      buttonText="Enter Admin Panel"
      helperText="Need a standard account?"
      helperLinkTo="/login"
      helperLinkText="Go to user sign in"
      asideTitle="Control center."
      asideCopy="Use this access path only for administrators. User and Technician accounts are blocked from admin pages."
      highlights={[
        'Separate admin credentials',
        'Protected access to privileged actions',
        'User and Technician roles stay outside admin pages',
      ]}
      onSubmit={handleAdminSubmit}
    >
      <label htmlFor="admin-username">Admin Username</label>
      <input
        id="admin-username"
        type="text"
        name="username"
        placeholder="Enter admin username"
        autoComplete="username"
        value={adminData.username}
        onChange={handleAdminChange}
        onBlur={handleAdminBlur}
        aria-invalid={Boolean(adminTouched.username && adminErrors.username)}
        aria-describedby="admin-username-error"
      />
      {adminTouched.username && adminErrors.username ? (
        <p className="field-error" id="admin-username-error">
          {adminErrors.username}
        </p>
      ) : null}

      <label htmlFor="admin-password">Admin Password</label>
      <input
        id="admin-password"
        type="password"
        name="password"
        placeholder="Enter admin password"
        autoComplete="current-password"
        value={adminData.password}
        onChange={handleAdminChange}
        onBlur={handleAdminBlur}
        aria-invalid={Boolean(adminTouched.password && adminErrors.password)}
        aria-describedby="admin-password-error"
      />
      {adminTouched.password && adminErrors.password ? (
        <p className="field-error" id="admin-password-error">
          {adminErrors.password}
        </p>
      ) : null}

      {submitError ? <p className="field-error">{submitError}</p> : null}
    </AuthLayout>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getStoredSession();
  const displayName = location.state?.displayName || session?.displayName || 'Campus Member';
  const role = location.state?.role || session?.role || ROLE_USER;
  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS[ROLE_USER];

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role === ROLE_ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  const handleSignOut = () => {
    clearSession();
    navigate('/login', {
      replace: true,
    });
  };

  return (
    <main className="home-page home-page-user">
      <section className="home-hero" aria-label="home intro">
        <div className="home-hero-copy">
          <p className="home-kicker">Smart Campus Workspace</p>
          <h1>
            Welcome, {displayName}
            <span className="home-role-pill">{roleLabel}</span>
          </h1>
          <p>
            Manage academics, campus services, and your daily tasks in one professional dashboard
            experience.
          </p>
          <div className="home-actions">
            <button type="button" className="home-btn home-btn-primary">
              Open Dashboard
            </button>
            <Link to="/resources" className="home-btn home-btn-outline link-btn">
              Browse Resources
            </Link>
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
        <button type="button" className="home-link-button" onClick={handleSignOut}>
          Sign out
        </button>
        <Link to="/signup">Create another account</Link>
      </nav>
    </main>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getStoredSession();
  const displayName = location.state?.displayName || session?.displayName || 'Administrator';

  if (!session) {
    return <Navigate to="/admin-login" replace state={{ notice: 'Please sign in as an admin first.' }} />;
  }

  if (session.role !== ROLE_ADMIN) {
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{ notice: 'Admin pages are restricted to administrator accounts only.' }}
      />
    );
  }

  const handleSignOut = () => {
    clearSession();
    navigate('/login', {
      replace: true,
    });
  };

  return (
    <main className="home-page admin-page">
      <section className="home-hero admin-hero" aria-label="admin intro">
        <div className="home-hero-copy">
          <p className="home-kicker">Admin Control Panel</p>
          <h1>
            Welcome, {displayName}
            <span className="home-role-pill home-role-pill-admin">Admin</span>
          </h1>
          <p>
            Review campus operations, manage privileged workflows, and keep restricted tools in one
            controlled space.
          </p>
          <div className="home-actions">
            <Link to="/resources" className="home-btn home-btn-primary link-btn">
              Manage Resources
            </Link>
            <button type="button" className="home-btn home-btn-outline">
              Review Audit Log
            </button>
          </div>
        </div>

        <div className="home-status-card admin-status-card" aria-label="admin summary">
          <h2>Admin snapshot</h2>
          <ul>
            <li>
              <span>Pending approvals</span>
              <strong>4</strong>
            </li>
            <li>
              <span>Open incidents</span>
              <strong>1</strong>
            </li>
            <li>
              <span>Restricted modules</span>
              <strong>8 active</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="home-grid admin-grid" aria-label="admin tasks">
        <article className="home-tile">
          <h3>Account Oversight</h3>
          <p>Review role assignments and confirm that access stays aligned with policy.</p>
        </article>
        <article className="home-tile">
          <h3>Service Health</h3>
          <p>Check the status of campus systems and respond to operational issues.</p>
        </article>
        <article className="home-tile">
          <h3>Compliance Review</h3>
          <p>Monitor activity logs and restricted actions for accountability.</p>
        </article>
      </section>

      <nav className="home-nav-links" aria-label="admin session links">
        <button type="button" className="home-link-button" onClick={handleSignOut}>
          Sign out
        </button>
        <Link to="/admin-login">Return to admin sign in</Link>
      </nav>
    </main>
  );
}

function RoleRedirect() {
  return <Navigate to={getSessionRedirectPath(getStoredSession())} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/resources/:id" element={<ResourceDetailPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Routes>
  );
}

export default App;
