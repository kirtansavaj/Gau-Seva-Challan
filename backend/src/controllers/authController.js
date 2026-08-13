const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'gausevasecretkey2026';

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            admin: { username: admin.username }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { username, newPassword } = req.body;

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Update username if provided
        if (username && username !== admin.username) {
            const existing = await Admin.findOne({ username });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Username is already taken' });
            }
            admin.username = username;
        }

        // Update password if provided
        if (newPassword && newPassword.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(newPassword, salt);
        }

        await admin.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            admin: { username: admin.username }
        });
    } catch (error) {
        next(error);
    }
};
