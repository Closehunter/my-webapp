import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop'; // New import for cropping
import './App.css';
import { supabase } from './supabaseClient';

// Placeholder icons (no emojis, styled via CSS) - except for eye toggles and settings
const ProjectsIcon = () => <div className="icon-placeholder"></div>;
const BiddingsIcon = () => <div className="icon-placeholder"></div>;
const PublicProjectsIcon = () => <div className="icon-placeholder"></div>;
const PrivateProjectsIcon = () => <div className="icon-placeholder"></div>;
const ContactsIcon = () => <div className="icon-placeholder"></div>;
const LogoutIcon = () => <div className="icon-placeholder"></div>;
const CloseIcon = () => <div className="icon-placeholder"></div>;
const CheckIcon = () => <div className="icon-placeholder"></div>;
const EyeIcon = () => <div>👁️</div>; // Restored emoji for password toggle
const EyeOffIcon = () => <div>👁️‍🗨️</div>; // Restored emoji for password toggle
const SettingsIcon = () => <div className="settings-emoji">⚙️</div>; // Emoji for app bar settings

function App() {
  const [selected, setSelected] = useState('CompanyProjectsListings'); // Default to first item
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState(''); // New state for logo URL
  const [signedIn, setSignedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpTitle, setSignUpTitle] = useState('');
  const [signUpCompanyName, setSignUpCompanyName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [logoFile, setLogoFile] = useState(null); // New state for logo file (cropped)
  const [logoPreview, setLogoPreview] = useState(''); // New state for preview
  const [showCropper, setShowCropper] = useState(false); // New state for crop modal
  const [crop, setCrop] = useState({ x: 0, y: 0 }); // Cropper state
  const [zoom, setZoom] = useState(1); // Cropper state
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); // Cropper state
  const [imageSrc, setImageSrc] = useState(''); // Temp image source for cropper
  const [signUpError, setSignUpError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Inline checkUser logic to avoid ESLint dependency warning
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        setEmail(user.email);
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, title, company_name, phone, logo_url')
          .eq('user_id', user.id)
          .single();
        if (userData) {
          setFullName(userData.full_name);
          setTitle(userData.title || '');
          setCompanyName(userData.company_name);
          setPhone(userData.phone || '');
          setLogoUrl(userData.logo_url || ''); // Fetch logo URL
          setSignedIn(true);
        }
      }
    };
    checkUser();
  }, []); // Empty array for mount-only execution

  // New handler for logo file selection - opens cropper if valid
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSignUpError('Please select an image file (JPEG or PNG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setSignUpError('Image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowCropper(true); // Open cropper modal
      };
      reader.readAsDataURL(file);
      setSignUpError('');
    }
  };

  // New onCropComplete handler for react-easy-crop
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // New function to generate cropped image as Blob
  const createCroppedImage = useCallback(async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 0.8);
    });
  }, []);

  // New handler for confirming crop
  const handleCropConfirm = async () => {
    try {
      if (!croppedAreaPixels || !imageSrc) return;
      const croppedImageBlob = await createCroppedImage(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedImageBlob], 'logo.png', { type: 'image/png' });
      setLogoFile(croppedFile);
      const previewUrl = URL.createObjectURL(croppedImageBlob);
      setLogoPreview(previewUrl);
      setShowCropper(false);
    } catch (error) {
      setSignUpError('Error processing image. Please try again.');
    }
  };

  // New handler for canceling crop
  const handleCropCancel = () => {
    setShowCropper(false);
    setImageSrc('');
    setLogoFile(null);
    setLogoPreview('');
    // Reset file input
    document.getElementById('logo-upload').value = '';
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleAvatarClick = () => {
    if (!signedIn) {
      showToast('Please log in first.', 'error');
      return;
    }
    setSelected('Profile');
    setDrawerOpen(false); // Close drawer if open on mobile
  };

  const handleSettingsClick = () => {
    if (!signedIn) {
      showToast('Please log in first.', 'error');
      return;
    }
    setSelected('Settings');
    setDrawerOpen(false); // Close drawer if open on mobile
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
        .select('full_name, title, company_name, phone, logo_url')
        .eq('user_id', user.id)
        .single();
      if (userData) {
        setFullName(userData.full_name);
        setTitle(userData.title || '');
        setCompanyName(userData.company_name);
        setPhone(userData.phone || '');
        setLogoUrl(userData.logo_url || ''); // Fetch logo URL
        setSignedIn(true);
        setSelected('CompanyProjectsListings'); // Redirect to default section
        setPassword('');
        showToast('Welcome back! Successfully logged in.', 'success');
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
    if (!signUpPhone.trim()) {
      setSignUpError('Phone number is required.');
      return;
    }
    if (!signUpTitle.trim()) {
      setSignUpError('Title is required.');
      return;
    }
    const { data: existingFullName } = await supabase
      .from('users')
      .select('full_name')
      .eq('full_name', signUpFullName);
    if (existingFullName && existingFullName.length > 0) {
      setSignUpError('Full name is already taken. Please enter differently.');
      return;
    }
    const { data: existingCompany } = await supabase
      .from('users')
      .select('company_name')
      .eq('company_name', signUpCompanyName);
    if (existingCompany && existingCompany.length > 0) {
      setSignUpError('Company name is already taken. Please choose another.');
      return;
    }
    try {
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
      let logoUrlToSave = null;
      if (logoFile) {
        // Upload logo to Supabase Storage
        const fileName = `${user.id}/logo.png`; // Always PNG after crop
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false,
          });
        if (uploadError) {
          setSignUpError('Error uploading logo. Please try again.');
          return;
        }
        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);
        logoUrlToSave = publicUrl;
      }
      const { error: insertError } = await supabase.from('users').insert([
        {
          user_id: user.id,
          full_name: signUpFullName,
          title: signUpTitle,
          company_name: signUpCompanyName,
          phone: signUpPhone,
          logo_url: logoUrlToSave, // Save logo URL
        },
      ]);
      if (insertError) {
        setSignUpError('Error creating account. Please try again.');
        return;
      }
      showToast('Account created successfully! Please log in.', 'success');
      setIsSignUp(false);
      setEmail(signUpEmail);
      setSignUpFullName('');
      setSignUpTitle('');
      setSignUpCompanyName('');
      setSignUpPhone('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setLogoFile(null);
      setLogoPreview('');
    } catch (error) {
      setSignUpError('An error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSignedIn(false);
    setEmail('');
    setPassword('');
    setCompanyName('');
    setFullName('');
    setTitle('');
    setPhone('');
    setLogoUrl('');
    setSelected('CompanyProjectsListings');
    setDrawerOpen(false);
    showToast('Successfully logged out. See you soon!', 'success');
  };

  const handleNavClick = (page) => {
    if (!signedIn) {
      const message = isSignUp ? 'Please complete sign up first.' : 'Please log in first.';
      showToast(message, 'error');
      return;
    }
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
        <div className="app-title">Construction Bidding Platform</div>
        <div className="app-bar-right">
          <div className="user-avatar" onClick={handleAvatarClick}>
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="avatar-logo" />
            ) : (
              signedIn && companyName ? companyName.charAt(0).toUpperCase() : '?'
            )}
          </div>
          <div className="settings-btn" onClick={handleSettingsClick}>
            <SettingsIcon />
          </div>
        </div>
      </header>

      <nav className="sidebar-desktop">
        <button
          className={`nav-btn ${selected === 'CompanyProjectsListings' ? 'active' : ''}`}
          onClick={() => handleNavClick('CompanyProjectsListings')}
          disabled={!signedIn}
        >
          <ProjectsIcon /> Company Projects/Listings
        </button>
        <button
          className={`nav-btn ${selected === 'CompanyBiddings' ? 'active' : ''}`}
          onClick={() => handleNavClick('CompanyBiddings')}
          disabled={!signedIn}
        >
          <BiddingsIcon /> Company Biddings
        </button>
        <button
          className={`nav-btn ${selected === 'PublicProjectsListings' ? 'active' : ''}`}
          onClick={() => handleNavClick('PublicProjectsListings')}
          disabled={!signedIn}
        >
          <PublicProjectsIcon /> Public Projects/Listings
        </button>
        <button
          className={`nav-btn ${selected === 'PrivateProjectsListings' ? 'active' : ''}`}
          onClick={() => handleNavClick('PrivateProjectsListings')}
          disabled={!signedIn}
        >
          <PrivateProjectsIcon /> Private Projects/Listings
        </button>
        <button
          className={`nav-btn ${selected === 'Contacts' ? 'active' : ''}`}
          onClick={() => handleNavClick('Contacts')}
          disabled={!signedIn}
        >
          <ContactsIcon /> Contacts
        </button>
      </nav>

      {drawerOpen && (
        <>
          <div className="overlay" onClick={() => setDrawerOpen(false)}></div>
          <nav className={`drawer ${drawerOpen ? 'open' : ''}`}>
            <div className="drawer-header">
              <h2>Menu</h2>
              <button className="close-btn" onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <button
              className={`drawer-item ${selected === 'CompanyProjectsListings' ? 'active' : ''}`}
              onClick={() => handleNavClick('CompanyProjectsListings')}
              disabled={!signedIn}
            >
              <ProjectsIcon /> Company Projects/Listings
            </button>
            <button
              className={`drawer-item ${selected === 'CompanyBiddings' ? 'active' : ''}`}
              onClick={() => handleNavClick('CompanyBiddings')}
              disabled={!signedIn}
            >
              <BiddingsIcon /> Company Biddings
            </button>
            <button
              className={`drawer-item ${selected === 'PublicProjectsListings' ? 'active' : ''}`}
              onClick={() => handleNavClick('PublicProjectsListings')}
              disabled={!signedIn}
            >
              <PublicProjectsIcon /> Public Projects/Listings
            </button>
            <button
              className={`drawer-item ${selected === 'PrivateProjectsListings' ? 'active' : ''}`}
              onClick={() => handleNavClick('PrivateProjectsListings')}
              disabled={!signedIn}
            >
              <PrivateProjectsIcon /> Private Projects/Listings
            </button>
            <button
              className={`drawer-item ${selected === 'Contacts' ? 'active' : ''}`}
              onClick={() => handleNavClick('Contacts')}
              disabled={!signedIn}
            >
              <ContactsIcon /> Contacts
            </button>
          </nav>
        </>
      )}

      <main className="main-content">
        {!signedIn ? (
          <div className="auth-form">
            <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
            {loginError && <div className="error-msg">{loginError}</div>}
            {signUpError && <div className="error-msg">{signUpError}</div>}
            {!isSignUp ? (
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="password-input-wrapper">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <button type="submit" className="submit-btn">
                  Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signUpFullName}
                  onChange={(e) => setSignUpFullName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Title (e.g., Project Manager)"
                  value={signUpTitle}
                  onChange={(e) => setSignUpTitle(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={signUpCompanyName}
                  onChange={(e) => setSignUpCompanyName(e.target.value)}
                  required
                />
                {/* Updated logo upload section */}
                <div className="logo-upload">
                  <label htmlFor="logo-upload" className="logo-label">
                    Company Logo (Optional)
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <div className="logo-dropzone" onClick={() => document.getElementById('logo-upload').click()}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="logo-preview" />
                    ) : (
                      <div className="logo-placeholder">
                        <div className="logo-icon">📷</div>
                        <p>Click to upload or drag and drop your company logo</p>
                        <small>JPEG/PNG, max 5MB</small>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                />
                <div className="password-input-wrapper">
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  >
                    {showSignUpPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <button type="submit" className="submit-btn">
                  Sign Up
                </button>
              </form>
            )}
            <p className="toggle-text">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span onClick={() => { setIsSignUp(!isSignUp); setSignUpError(''); setLoginError(''); setLogoFile(null); setLogoPreview(''); setImageSrc(''); }}>
                {isSignUp ? 'Login' : 'Sign Up'}
              </span>
            </p>
          </div>
        ) : (
          <>
            {['CompanyProjectsListings', 'CompanyBiddings', 'PublicProjectsListings', 'PrivateProjectsListings', 'Contacts'].includes(selected) && (
              <div className="section-placeholder">
                <h2>{selected.replace(/([A-Z])/g, ' $1').trim()}</h2>
                <p>Features for {selected} coming soon.</p>
              </div>
            )}

            {selected === 'Profile' && (
              <div className="profile-card">
                <h2>Your Profile</h2>
                <div className="profile-avatar">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="profile-logo" />
                  ) : (
                    <div className="profile-initial">{companyName.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div className="profile-item">
                  <span className="label">Company Name:</span>
                  <span className="value">{companyName}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Full Name:</span>
                  <span className="value">{fullName}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Title:</span>
                  <span className="value">{title}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Phone:</span>
                  <span className="value">{phone}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Email:</span>
                  <span className="value">{email}</span>
                </div>
                <button className="profile-logout-btn" onClick={handleLogout}>
                  <LogoutIcon /> Logout
                </button>
              </div>
            )}

            {selected === 'Settings' && (
              <div className="settings-section">
                <h2>Settings</h2>
                <p>Settings features coming soon.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* New Crop Modal */}
      {showCropper && (
        <div className="crop-modal">
          <div className="crop-modal-overlay" onClick={handleCropCancel}></div>
          <div className="crop-modal-content">
            <div className="crop-header">
              <h3>Crop Your Logo</h3>
              <button className="crop-close" onClick={handleCropCancel}>
                <CloseIcon />
              </button>
            </div>
            <div className="crop-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Square for circle
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="crop-actions">
              <button className="crop-cancel" onClick={handleCropCancel}>
                Cancel
              </button>
              <button className="crop-confirm" onClick={handleCropConfirm}>
                Confirm Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <div className="icon">{toast.type === 'success' ? <CheckIcon /> : <CloseIcon />}</div>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: 'success' })}>
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
