const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
.then(() => console.log("MongoDB connected successfully."))
.catch(err => console.error("MongoDB connection error:", err));

// --- SCHEMAS AND MODELS ---
const UserSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: { type: String, required: true }, role: { type: String, enum: ['organizer', 'worker'], required: true }, profile: { bio: { type: String, default: '' }, skills: [{ type: String }], averageRating: { type: Number, default: 0 }, }, ratings: [{ byUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, rating: { type: Number, min: 1, max: 5, required: true }, review: { type: String }, }], }, { timestamps: true });
const JobSchema = new mongoose.Schema({ title: { type: String, required: true }, description: { type: String, required: true }, role: { type: String, required: true }, pay: { type: Number, required: true }, location: { type: String, required: true }, time: { type: Date, required: true }, organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, enum: ['open', 'assigned', 'completed'], default: 'open' }, assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, }, { timestamps: true });
const ApplicationSchema = new mongoose.Schema({ job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true }, worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }, }, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Job = mongoose.model('Job', JobSchema);
const Application = mongoose.model('Application', ApplicationSchema);

// --- MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) { return res.status(401).json({ message: 'No token, authorization denied' }); }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) { res.status(401).json({ message: 'Token is not valid' }); }
};

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) { return res.status(400).json({ message: 'Please provide all required fields.' }); }
        const existingUser = await User.findOne({ email });
        if (existingUser) { return res.status(400).json({ message: 'User with this email already exists.' }); }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ name, email, password: hashedPassword, role });
        const savedUser = await newUser.save();
        res.status(201).json({ id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role });
    } catch (error) { res.status(500).json({ message: 'Server error during registration.' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) { return res.status(400).json({ message: 'Please provide email and password.' }); }
        const user = await User.findOne({ email });
        if (!user) { return res.status(400).json({ message: 'Invalid credentials.' }); }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(400).json({ message: 'Invalid credentials.' }); }
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        });
    } catch (error) { res.status(500).json({ message: 'Server error during login.' }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.json(user);
    } catch (error) { res.status(500).send('Server Error'); }
});

// --- JOB ROUTES ---
app.post('/api/jobs', authMiddleware, async (req, res) => {
    if (req.user.role !== 'organizer') { return res.status(403).json({ message: 'Access denied.' }); }
    try {
        const { title, description, role, pay, location, time } = req.body;
        const newJob = new Job({ title, description, role, pay, location, time, organizer: req.user.id });
        const job = await newJob.save();
        res.status(201).json(job);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/jobs', authMiddleware, async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'open' }).populate('organizer', 'name').sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/jobs/organizer', authMiddleware, async (req, res) => {
    if (req.user.role !== 'organizer') { return res.status(403).json({ message: 'Access denied.' }); }
    try {
        const jobs = await Job.find({ organizer: req.user.id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/jobs/:id', authMiddleware, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('organizer', 'name');
        if (!job) { return res.status(404).json({ message: 'Job not found' }); }
        res.json(job);
    } catch (err) { res.status(500).send('Server Error'); }
});

// --- APPLICATION ROUTES ---
app.post('/api/applications', authMiddleware, async (req, res) => {
    if (req.user.role !== 'worker') { return res.status(403).json({ message: 'Only workers can apply.' }); }
    try {
        const { jobId } = req.body;
        const existingApplication = await Application.findOne({ job: jobId, worker: req.user.id });
        if (existingApplication) { return res.status(400).json({ message: 'You have already applied.' }); }
        const newApplication = new Application({ job: jobId, worker: req.user.id });
        await newApplication.save();
        res.status(201).json(newApplication);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/applications/job/:jobId', authMiddleware, async (req, res) => {
    try {
        const applications = await Application.find({ job: req.params.jobId }).populate('worker', 'name email profile');
        res.json(applications);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.put('/api/applications/:appId', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.appId).populate('job');
        if (!application) { return res.status(404).json({ message: 'Application not found.' }); }
        
        // Security Check: Ensure the user making the request is the job organizer
        if (application.job.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized.' });
        }

        application.status = status;
        await application.save();

        if (status === 'accepted') {
            await Job.findByIdAndUpdate(application.job._id, {
                status: 'assigned',
                assignedWorker: application.worker
            });
        }
        res.json(application);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

