// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'operator' }, // 'admin' or 'operator'
});

const User = mongoose.model('User', userSchema);

// Visitor Schema
const visitorSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  address: String,
  idProof: String,
  personToMeet: String,
  designation: String,
  department: String,
  meetingPurpose: String,
  photo: String,
  qrData: String, // Store the QR data
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// Register Route
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword, role });
  await user.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

// Create Visitor Pass Route
app.post('/visitor-pass', async (req, res) => {
  try {
    const { name, mobile, address, idProof, personToMeet, designation, department, meetingPurpose, photo } = req.body;

    // Create a new visitor document
    const visitor = new Visitor({
      name,
      mobile,
      address,
      idProof,
      personToMeet,
      designation,
      department,
      meetingPurpose,
      photo // Store only essential data for QR
    });

    await visitor.save();

    // Return the saved visitor data, including the QR data
    res.status(201).json(visitor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create visitor pass' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
