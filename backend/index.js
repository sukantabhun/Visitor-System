// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cloudinary = require('cloudinary').v2; // Import Cloudinary
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Use PORT from .env

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
// Create Visitor Pass Route
app.post('/visitor-pass', async (req, res) => {
  try {
    const {
      name,
      mobile,
      address,
      idProof,
      personToMeet,
      designation,
      department,
      meetingPurpose,
      photo, // Base64 image from frontend
    } = req.body;

    // Validate photo
    if (!photo || !photo.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Upload Base64 image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(photo, {
      folder: 'visitor_passes', // Organize images in Cloudinary
      resource_type: 'image',   // Ensure it's treated as an image
    });

    // Create a visitor document with Cloudinary URL
    const visitor = new Visitor({
      name,
      mobile,
      address,
      idProof,
      personToMeet,
      designation,
      department,
      meetingPurpose,
      photo: uploadResponse.secure_url, // Store only the URL
      createdAt: new Date(), // Use the current date and time
    });

    // Save visitor to MongoDB
    await visitor.save();

    res.status(201).json(visitor); // Respond with visitor data
  } catch (error) {
    console.error('Error creating visitor pass:', error);
    res.status(500).json({ error: 'Failed to create visitor pass' });
  }
});
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password from the response
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, password, role } = req.body;

  try {
    const updateData = { name, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10); // Hashing the password
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.status(204).send(); // No Content response
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});



// Get Visitors Route
app.get('/visitors', async (req, res) => {
  try {
    const { date, department } = req.query;

    // Parse the date from the query and find visitors for that day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999); // End of the day in UTC

    // Build the query for finding visitors
    const query = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    // If a specific department is provided and is not "All", add it to the query
    if (department && department !== 'All') {
      query.department = department; // Assuming 'department' is a field in your Visitor model
    }

    // Find visitors within the specified date range and department
    const visitors = await Visitor.find(query);

    // If no visitors are found, return an empty array
    if (!visitors || visitors.length === 0) {
      return res.status(404).json({ message: 'No visitors found for the specified date and department' });
    }

    // Respond with the list of visitors, including the photo URL
    res.status(200).json(visitors);
  } catch (error) {
    console.error('Error retrieving visitors:', error);
    res.status(500).json({ error: 'Failed to retrieve visitors' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
