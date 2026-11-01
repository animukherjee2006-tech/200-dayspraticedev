const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const redisClient = require('../db/redis');
const { sendOTPEmail } = require('../services/emailService');

// 1. Regular Registration (OTP trigger)
exports.register = async (req, res) => {
    try {
        const { Username, Email, password } = req.body;

        const existingUser = await User.findOne({ Email });
        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({ message: "Email is already registered and verified." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = { Username, Email, password: hashedPassword };
        
        // Cache data for 5 mins (300 seconds)
        await redisClient.setEx(`otp:${Email}`, 300, otp);
        await redisClient.setEx(`user-data:${Email}`, 300, JSON.stringify(userData));

        // Use email service
        await sendOTPEmail(Email, Username, otp);

        res.status(200).json({ message: "OTP sent to your email. Please verify within 5 minutes." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 2. Verify Registration OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { Email, otp } = req.body;

        const cachedOtp = await redisClient.get(`otp:${Email}`);
        const cachedUserData = await redisClient.get(`user-data:${Email}`);

        if (!cachedOtp || !cachedUserData) {
            return res.status(400).json({ message: "OTP expired or invalid. Register again." });
        }

        if (cachedOtp !== otp) {
            return res.status(400).json({ message: "Incorrect OTP." });
        }

        const parsedData = JSON.parse(cachedUserData);
        
        let user = await User.findOne({ Email });
        if (!user) {
            user = new User({
                Username: parsedData.Username,
                Email: parsedData.Email,
                password: parsedData.password
            });
        }
        
        user.isVerified = true;
        await user.save();

        // Flush Redis Cache
        await redisClient.del(`otp:${Email}`);
        await redisClient.del(`user-data:${Email}`);

        res.status(201).json({ message: "Account verified and registered successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 3. Handle OAuth Callback
exports.googleCallback = (req, res) => {
    const token = jwt.sign(
        { id: req.user._id, email: req.user.Email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
    );

    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({ message: "Google Authentication Successful", token });
};
