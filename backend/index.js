// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
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

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  qrData: String,
  createdAt: { type: Date, default: () => new Date(new Date().setHours(0, 0, 0, 0)) }, // Store only date
});
const Visitor = mongoose.model('Visitor', visitorSchema);

// Department Schema
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const Department = mongoose.model('Department', departmentSchema);

// Authentication Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Register Route
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    if (existingUser) return res.status(409).json({ error: 'User with this name or email already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
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
    const {
      name, mobile, address, idProof, personToMeet,
      designation, department, meetingPurpose, photo,
    } = req.body;
    if (!photo || !photo.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid image format' });
    const uploadResponse = await cloudinary.uploader.upload(photo, {
      folder: 'visitor_passes', resource_type: 'image',
    });
    const visitor = new Visitor({
      name, mobile, address, idProof, personToMeet,
      designation, department, meetingPurpose,
      photo: uploadResponse.secure_url,
      createdAt: new Date(),
    });
    await visitor.save();
    res.status(201).json(visitor);
  } catch (error) {
    console.error('Error creating visitor pass:', error);
    res.status(500).json({ error: 'Failed to create visitor pass' });
  }
});

// Get Users
app.get('/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update User
app.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, password, role } = req.body;
  try {
    const updateData = { name, role };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete User
app.delete('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get Visitors
app.get('/visitors', verifyToken, async (req, res) => {
  try {
    const { date, department } = req.query;
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const query = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    if (department && department !== 'All') query.department = department;
    const visitors = await Visitor.find(query);
    if (!visitors) return res.status(404).json({ message: 'No visitors found' });
    res.status(200).json(visitors);
  } catch (error) {
    console.error('Error retrieving visitors:', error);
    res.status(500).json({ error: 'Failed to retrieve visitors' });
  }
});

// Department Routes
app.post('/departments', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
    const { name } = req.body;
    const existingDept = await Department.findOne({ name });
    if (existingDept) return res.status(400).json({ message: 'Department already exists.' });
    const department = new Department({ name });
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Failed to create department' });
  }
});

app.get('/departments', verifyToken, async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

app.delete('/departments/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Failed to delete department' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
