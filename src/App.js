import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const [selected, setSelected] = useState('Home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const user = session.user;
      setEmail(user.email);
      
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('user_id', user.id)
        .single();
      
      if (userData) {
        setUsername(userData.username);
        setSignedIn(true);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Incorrect email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Please verify your email address first.');
        } else {
          setLoginError(error.message);
        }
        return;
      }

      const user = data.user;
      setEmail(user.email);

      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        setUsername(userData.username);
        setSignedIn(true);
        setPassword('');
      }
    } catch (error) {
      setLoginError('An error occurred. Please try again.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError('');

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match!');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', signUpUsername);

      if (existingUsername && existingUsername.length > 0) {
        setSignUpError('Username is already taken. Please choose another.');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setSignUpError('An account with this email already exists.');
        } else {
          setSignUpError(error.message);
        }
        return;
      }

      const user = data.user;

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            user_id: user.id,
            username: signUpUsername,
          },
        ]);

      if (insertError) {
        setSignUpError('Error creating account. Please try again.');
        return;
      }

      alert('Account created successfully! Please log in.');
      setIsSignUp(false);
      setEmail(signUpEmail);
      setSignUpUsername('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
    } catch (error) {
      setSignUpError('An error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSignedIn(false);
    setEmail('');
    setPassword('');
    setUsername('');
    setSelected('Home');
    setDrawerOpen(false);
  };

  const handleNavClick = (page) => {
    setSelected(page);
    setDrawerOpen(false);
  };

  return (
    <div className="app-root">
      <header className="app-bar">
        <button className="menu-button" onClick={() => setDrawerOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="app-title">My Webapp</h1>
        {signedIn && (
          <div className="user-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </header>

      <aside className="sidebar-desktop">
        <button 
          className={`nav-btn ${selected === 'Home' ? 'active' : ''}`}
          onClick={() => setSelected('Home')}
        >
          Home
        </button>
        {signedIn && (
          <button 
            className={`nav-btn ${selected === 'Profile' ? 'active' : ''}`}
            onClick={() => setSelected('Profile')}
          >
            Profile
          </button>
        )}
        <button 
          className={`nav-btn ${selected === 'Settings' ? 'active' : ''}`}
          onClick={() => setSelected('Settings')}
        >
          Settings
        </button>
        {signedIn && (
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </aside>

      {drawerOpen && <div className="overlay" onClick={() => setDrawerOpen(false)}></div>}

      <nav className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <button 
          className={`drawer-item ${selected === 'Home' ? 'active' : ''}`}
          onClick={() => handleNavClick('Home')}
        >
          Home
        </button>
        {signedIn && (
          <button 
            className={`drawer-item ${selected === 'Profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('Profile')}
          >
            Profile
          </button>
        )}
        <button 
          className={`drawer-item ${selected === 'Settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('Settings')}
        >
          Settings
        </button>
        {signedIn && (
          <button className="drawer-item logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>

      <main className="main-content">
        {selected === 'Home' && !signedIn && !isSignUp && (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Log In</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {loginError && <p className="error-msg">{loginError}</p>}
            <button type="submit" className="submit-btn">Log In</button>
            <p className="toggle-text">
              Don't have an account?{' '}
              <span onClick={() => setIsSignUp(true)}>Sign Up</span>
            </p>
          </form>
        )}

        {selected === 'Home' && !signedIn && isSignUp && (
          <form onSubmit={handleSignUp} className="auth-form">
            <h2>Sign Up</h2>
            <input
              type="text"
              placeholder="Username"
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={signUpConfirmPassword}
              onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              required
            />
            {signUpError && <p className="error-msg">{signUpError}</p>}
            <button type="submit" className="submit-btn">Sign Up</button>
            <p className="toggle-text">
              Already have an account?{' '}
              <span onClick={() => setIsSignUp(false)}>Log In</span>
            </p>
          </form>
        )}

        {selected === 'Home' && signedIn && (
          <div className="welcome-section">
            <h1>Welcome back, {username}!</h1>
            <p>Use the menu to navigate to your profile or settings.</p>
          </div>
        )}

        {selected === 'Profile' && (
          <div className="profile-card">
            <h2>Your Profile</h2>
            <div className="profile-item">
              <span className="label">Username:</span>
              <span className="value">{username}</span>
            </div>
            <div className="profile-item">
              <span className="label">Email:</span>
              <span className="value">{email}</span>
            </div>
          </div>
        )}

        {selected === 'Settings' && (
          <div className="settings-section">
            <h2>Settings</h2>
            <p>Settings features coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
