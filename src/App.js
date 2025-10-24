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
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
  };

  const handleMenuClick = (page) => {
    setSelected(page);
    setMenuOpen(false);
  };

  return (
    <div className="container">
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => handleMenuClick('Home')}>Home</button>
        {signedIn && <button onClick={() => handleMenuClick('Profile')}>Profile</button>}
        <button onClick={() => handleMenuClick('Settings')}>Settings</button>
        {signedIn && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </aside>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)}></div>}

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
