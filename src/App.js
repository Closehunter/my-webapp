import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop'; // New import for cropping
import './App.css';
import { supabase } from './supabaseClient';

// Placeholder icons (no emojis, styled via CSS) - except for eye toggles and settings
const DashboardIcon = () => <div className="icon-placeholder"></div>; // New icon for Dashboard
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
const EditIcon = () => <div className="icon-placeholder"></div>; // New icon for edit button

function App() {
  const [selected, setSelected] = useState('Dashboard'); // Updated default to Dashboard
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
  // New states for profile edit
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileLogoFile, setProfileLogoFile] = useState(null); // Separate for profile edit
  const [profileLogoPreview, setProfileLogoPreview] = useState(''); // Separate for profile edit
  const [profileImageSrc, setProfileImageSrc] = useState('');
  const [profileCroppedAreaPixels, setProfileCroppedAreaPixels] = useState(null);
  const [profileCrop, setProfileCrop] = useState({ x: 0, y: 0 });
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileError, setProfileError] = useState('');

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
          setEditTitle(userData.title || ''); // Pre-fill edit states
          setEditPhone(userData.phone || '');
          setSignedIn(true);
          setSelected('Dashboard'); // Updated default to Dashboard
        }
      }
    };
    checkUser();
  }, []); // Empty array for mount-only execution

  // New handler for logo file selection in profile - opens cropper if valid
  const handleProfileLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError('Please select an image file (JPEG or PNG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setProfileError('Image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageSrc(reader.result);
        setShowCropper(true); // Reuse cropper, but track for profile
      };
      reader.readAsDataURL(file);
      setProfileError('');
    }
  };

  // Handler for logo file selection in sign-up
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

  // Updated onCropComplete to handle both sign-up and profile
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    if (editMode) {
      setProfileCroppedAreaPixels(croppedAreaPixels);
    } else {
      setCroppedAreaPixels(croppedAreaPixels);
    }
  }, [editMode]);

  // Updated createCroppedImage for reuse
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

  // Updated handleCropConfirm for both modes
  const handleCropConfirm = async () => {
    try {
      let croppedImageBlob, croppedFile, previewUrl;
      if (editMode) {
        if (!profileCroppedAreaPixels || !profileImageSrc) return;
        croppedImageBlob = await createCroppedImage(profileImageSrc, profileCroppedAreaPixels);
        croppedFile = new File([croppedImageBlob], 'logo.png', { type: 'image/png' });
        setProfileLogoFile(croppedFile);
        previewUrl = URL.createObjectURL(croppedImageBlob);
        setProfileLogoPreview(previewUrl);
      } else {
        if (!croppedAreaPixels || !imageSrc) return;
        croppedImageBlob = await createCroppedImage(imageSrc, croppedAreaPixels);
        croppedFile = new File([croppedImageBlob], 'logo.png', { type: 'image/png' });
        setLogoFile(croppedFile);
        previewUrl = URL.createObjectURL(croppedImageBlob);
        setLogoPreview(previewUrl);
      }
      setShowCropper(false);
    } catch (error) {
      if (editMode) {
        setProfileError('Error processing image. Please try again.');
      } else {
        setSignUpError('Error processing image. Please try again.');
      }
    }
  };

  // Updated handleCropCancel for both modes
  const handleCropCancel = () => {
    setShowCropper(false);
    if (editMode) {
      setProfileImageSrc('');
      setProfileLogoFile(null);
      setProfileLogoPreview('');
      document.getElementById('profile-logo-upload').value = '';
    } else {
      setImageSrc('');
      setLogoFile(null);
      setLogoPreview('');
      document.getElementById('logo-upload').value = '';
    }
  };

  // New handler to enter edit mode
  const enterEditMode = () => {
    setEditTitle(title);
    setEditPhone(phone);
    setProfileLogoPreview(logoUrl || ''); // Use current if exists
    setEditMode(true);
  };

  // New handler to save profile changes
  const saveProfileChanges = async () => {
    if (!editTitle.trim()) {
      setProfileError('Title is required.');
      return;
    }
    if (!editPhone.trim()) {
      setProfileError('Phone number is required.');
      return;
    }
    try {
      let newLogoUrl = logoUrl;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProfileError('Session expired. Please log in again.');
        return;
      }
      const userId = session.user.id;
      if (profileLogoFile) {
        // Upload/replace logo
        const fileName = `${userId}/logo.png`;
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, profileLogoFile, {
            cacheControl: '3600',
            upsert: true, // Allow overwrite
          });
        if (uploadError) {
          setProfileError('Error uploading logo. Please try again.');
          return;
        }
        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);
        newLogoUrl = publicUrl;
      }
      // Update user data
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          title: editTitle, 
          phone: editPhone, 
          logo_url: newLogoUrl 
        })
        .eq('user_id', userId)
        .select()
        .single();
      if (updateError) {
        setProfileError('Error saving changes. Please try again.');
        return;
      }
      // Update local state
      setTitle(editTitle);
      setPhone(editPhone);
      setLogoUrl(newLogoUrl);
      setEditMode(false);
      setProfileLogoFile(null);
      setProfileLogoPreview('');
      setProfileError('');
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      setProfileError('An error occurred. Please try again.');
    }
  };

  // New handler to cancel edit
  const cancelEdit = () => {
    setEditMode(false);
    setEditTitle(title);
    setEditPhone(phone);
    setProfileLogoFile(null);
    setProfileLogoPreview('');
    setProfileError('');
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
        .select('full_name, title, company_name, phone, logo_url') // Fixed: changed 'logout' to 'logo_url'
        .eq('user_id', user.id)
        .single();
      if (userData) {
        setFullName(userData.full_name);
        setTitle(userData.title || '');
        setCompanyName(userData.company_name);
        setPhone(userData.phone || '');
        setLogoUrl(userData.logo_url || ''); // Fetch logo URL
        setEditTitle(userData.title || '');
        setEditPhone(userData.phone || '');
        setSignedIn(true);
        setSelected('Dashboard'); // Updated redirect to Dashboard
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
    setSelected('Dashboard'); // Updated default on logout
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
        {/* New Dashboard button as first item */}
        <button
          className={`nav-btn ${selected === 'Dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('Dashboard')}
          disabled={!signedIn}
        >
          <DashboardIcon /> Dashboard
        </button>
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
            {/* New Dashboard item as first in drawer */}
            <button
              className={`drawer-item ${selected === 'Dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('Dashboard')}
              disabled={!signedIn}
            >
              <DashboardIcon /> Dashboard
            </button>
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
            {/* Updated condition to include Dashboard */}
            {['Dashboard', 'CompanyProjectsListings', 'CompanyBiddings', 'PublicProjectsListings', 'PrivateProjectsListings', 'Contacts'].includes(selected) && (
              <div className="section-placeholder">
                <h2>{selected.replace(/([A-Z])/g, ' $1').trim()}</h2>
                <p>Features for {selected} coming soon.</p>
              </div>
            )}

            {selected === 'Profile' && (
              <div className="profile-card">
                <h2>Your Profile</h2>
                {editMode ? (
                  // Edit Mode Form
                  <div className="profile-edit-form">
                    {profileError && <div className="error-msg">{profileError}</div>}
                    <div className="profile-avatar-edit">
                      <img src={profileLogoPreview || logoUrl} alt="Current Logo" className="profile-logo" />
                      <div className="logo-upload-edit">
                        <label htmlFor="profile-logo-upload" className="logo-label">
                          Change Logo (Optional)
                        </label>
                        <input
                          id="profile-logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleProfileLogoChange}
                          style={{ display: 'none' }}
                        />
                        <div className="logo-dropzone" onClick={() => document.getElementById('profile-logo-upload').click()}>
                          {profileLogoPreview ? (
                            <img src={profileLogoPreview} alt="New Preview" className="logo-preview" />
                          ) : (
                            <div className="logo-placeholder">
                              <div className="logo-icon">📷</div>
                              <p>Click to upload new logo</p>
                              <small>JPEG/PNG, max 5MB</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="profile-item-edit">
                      <span className="label">Company Name:</span>
                      <span className="value">{companyName}</span> {/* Read-only */}
                    </div>
                    <div className="profile-item-edit">
                      <span className="label">Full Name:</span>
                      <span className="value">{fullName}</span> {/* Read-only */}
                    </div>
                    <div className="profile-item-edit">
                      <label className="label">Title:</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="edit-input"
                        placeholder="Enter title"
                      />
                    </div>
                    <div className="profile-item-edit">
                      <label className="label">Phone:</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="edit-input"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="profile-item-edit">
                      <span className="label">Email:</span>
                      <span className="value">{email}</span> {/* Read-only */}
                    </div>
                    <div className="profile-edit-actions">
                      <button className="edit-cancel-btn" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button className="edit-save-btn" onClick={saveProfileChanges}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
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
                    <div className="profile-actions-row">
                      <button className="profile-logout-btn" onClick={handleLogout}>
                        <LogoutIcon /> Logout
                      </button>
                      <button className="edit-profile-btn" onClick={enterEditMode}>
                        <EditIcon /> Edit Profile
                      </button>
                    </div>
                  </div>
                )}
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

      {/* Updated Crop Modal - supports both modes */}
      {showCropper && (
        <div className="crop-modal">
          <div className="crop-modal-overlay" onClick={handleCropCancel}></div>
          <div className="crop-modal-content">
            <div className="crop-header">
              <h3>{editMode ? 'Crop New Logo' : 'Crop Your Logo'}</h3>
              <button className="crop-close" onClick={handleCropCancel}>
                <CloseIcon />
              </button>
            </div>
            <div className="crop-container">
              <Cropper
                image={editMode ? profileImageSrc : imageSrc}
                crop={editMode ? profileCrop : crop}
                zoom={editMode ? profileZoom : zoom}
                aspect={1} // Square for circle
                onCropChange={editMode ? setProfileCrop : setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={editMode ? setProfileZoom : setZoom}
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
