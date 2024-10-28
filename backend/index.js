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

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'operator' }, // 'admin' or 'operator'
});

const User = mongoose.model('User', userSchema);

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
  createdAt: { type: Date, default: () => new Date(new Date().setHours(0, 0, 0, 0)) },
});

const Visitor = mongoose.model('Visitor', visitorSchema);

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

// Admin Check Middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
  next();
};

// Routes

// Register User
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({
      $or: [
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { email: { $regex: `^${email}$`, $options: 'i' } },
      ],
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this name or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});



// Login User
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

// Check Admin Route
app.get('/check-admin', verifyToken, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  res.json({ isAdmin });
});

// Create Visitor Pass
app.post('/visitor-pass', verifyToken, async (req, res) => {
  try {
    const {
      name, mobile, address, idProof, personToMeet,
      designation, department, meetingPurpose, photo,
    } = req.body;

    if (!photo || !photo.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

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

// Get All Users (Admin-Only)

// Get User by Username
app.get('/users/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ name: { $regex: `^${username}$`, $options: 'i' } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User exists', user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});



app.get('/users', verifyToken, adminOnly, async (req, res) => {
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

// Delete User (Admin-Only)
app.delete('/users/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Department Routes
app.post('/departments', verifyToken, adminOnly, async (req, res) => {
  try {
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

app.delete('/departments/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
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