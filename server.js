const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 4000;
const USERS_CSV = path.join(__dirname, 'users.csv');

app.use(cors());
app.use(bodyParser.json());

// Write header if file does not exist
if (!fs.existsSync(USERS_CSV)) {
  fs.writeFileSync(USERS_CSV, 'Username,Email,Password\n');
}

// Sign Up endpoint - saves new user
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (username && email && password) {
    // Check if user already exists
    const data = fs.readFileSync(USERS_CSV, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const userExists = lines.some(line => {
      const [, userEmail] = line.split(',').map(field => field.replace(/"/g, ''));
      return userEmail === email;
    });

    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    fs.appendFileSync(USERS_CSV, `"${username}","${email}","${password}"\n`);
    res.status(200).json({ message: 'Account created successfully!' });
  } else {
    res.status(400).json({ message: 'All fields are required' });
  }
});

// Login endpoint - verifies credentials
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const data = fs.readFileSync(USERS_CSV, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    let emailFound = false;
    let username = '';
    
    // Skip header and check credentials
    for (let i = 1; i < lines.length; i++) {
      const [user, userEmail, userPassword] = lines[i]
        .split(',')
        .map(field => field.replace(/"/g, '').trim());
      
      if (userEmail === email) {
        emailFound = true;
        username = user;
        
        if (userPassword === password) {
          return res.status(200).json({ 
            message: 'Login successful', 
            username,
            email 
          });
        } else {
          return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }
      }
    }
    
    if (!emailFound) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }
  } else {
    res.status(400).json({ message: 'Email and password are required' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
