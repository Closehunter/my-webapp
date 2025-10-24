import React, { useState } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const [selected, setSelected] = useState('Home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

      if (error) {
        setLoginError('Unable to connect to database. Please try again.');
        return;
      }

      if (!users || users.length === 0) {
        setLoginError('No account found with this email address.');
        return;
      }

      const user = users[0];

      if (user.password !== password) {
        setLoginError('Incorrect password. Please try again.');
        return;
      }

      setSignedIn(true);
      setUsername(user.username);
      setEmail(user.email);
      setPassword('');
    } catch {
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
      const { data: existing } = await supabase
        .from('users')
        .select('email')
        .eq('email', signUpEmail);

      if (existing && existing.length > 0) {
        setSignUpError('An account with this email already exists.');
        return;
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            username: signUpUsername,
            email: signUpEmail,
            password: signUpPassword,
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
    } catch {
      setSignUpError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    setSignedIn(false);
    setEmail('');
    setPassword('');
    setUsername('');
    setSelected('Home');
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <button onClick={() => setSelected('Home')}>Home</button>
        {signedIn && <button onClick={() => setSelected('Profile')}>Profile</button>}
        <button onClick={() => setSelected('Settings')}>Settings</button>
        {signedIn && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </aside>
      <main className="main">
        {selected === 'Home' && !signedIn && !isSignUp && (
          <form onSubmit={handleLogin} className="log-in-form">
            <h2>Log In</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            /><br />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            /><br />
            {loginError && <p className="error-message">{loginError}</p>}
            <button type="submit">Log In</button>
            <p className="toggle-auth">
              Don't have an account?{' '}
              <span onClick={() => setIsSignUp(true)}>Sign Up</span>
            </p>
          </form>
        )}

        {selected === 'Home' && !signedIn && isSignUp && (
          <form onSubmit={handleSignUp} className="log-in-form">
            <h2>Sign Up</h2>
            <input
              type="text"
              placeholder="Username"
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              required
            /><br />
            <input
              type="email"
              placeholder="Email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            /><br />
            <input
              type="password"
              placeholder="Password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
            /><br />
            <input
              type="password"
              placeholder="Confirm Password"
              value={signUpConfirmPassword}
              onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              required
            /><br />
            {signUpError && <p className="error-message">{signUpError}</p>}
            <button type="submit">Sign Up</button>
            <p className="toggle-auth">
              Already have an account?{' '}
              <span onClick={() => setIsSignUp(false)}>Log In</span>
            </p>
          </form>
        )}

        {selected === 'Home' && signedIn && <h1>Welcome back, {username}!</h1>}
        {selected === 'Profile' && (
          <div className="profile-section">
            <h1>Your Profile</h1>
            <div className="profile-info">
              <p><strong>Username:</strong> {username}</p>
              <p><strong>Email:</strong> {email}</p>
            </div>
          </div>
        )}
        {selected === 'Settings' && <h1>Settings Panel</h1>}
      </main>
    </div>
  );
}

export default App;
