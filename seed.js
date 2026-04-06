const mongoose = require("mongoose");
const User = require("./src/models/userModel");
const Wallet = require("./src/models/walletModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();



// Seed Wallets for users
const generateAccountNumber = (prefix = '20' || '21') => {
    // Generate a random 8-digit number
    // Min: 10,000,000 | Max: 99,999,999
    const randomPart = crypto.randomInt(10000000, 100000000);

    return `${prefix}${randomPart}`;
};


const seedDatabase = async () => {
    try {
        // connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding.");

        // Pre-hash the password for all users
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create Admin & Auditor

        const adminExists = await User.findOne({ email: 'admin@Zorvyn.com' });
        if (!adminExists) {
            const newAdmin = new User({
                name: 'Zorvyn Admin',
                email: 'admin1@Zorvyn.com',
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                isBlocked: false
            });

            await newAdmin.save();

            console.log("Admin user created");
        }

        const auditorExists = await User.findOne({ email: 'auditor@Zorvyn.com' });
        if (!auditorExists) {
            const newAuditor = new User({
                name: 'Internal Auditor',
                email: 'auditor1@Zorvyn.com',
                password: hashedPassword,
                role: 'auditor',
                isVerified: true,
                isBlocked: false
            });
            await newAuditor.save();
        }

        console.log(" Auditor user created");

        // Seed Regular Users
        const count = 20
        const userData = [];

        for (let i = 1; i <= count; i++) {
            userData.push({
                name: `Test User ${i}`,
                email: `user${i}@zorvyn.com`,
                password: hashedPassword, // Use the pre-hashed password
                role: 'user',
                isVerified: true,
                isBlocked: false,
            });
        }

        // Insert Users and capture the returned documents (including their new _ids)
        const insertedUsers = await User.insertMany(userData, { ordered: false });
        console.log(` ${insertedUsers.length} Users inserted.`);

        // Seed Wallets for the inserted users

        const walletData = insertedUsers.map(user => ({
            userId: user._id,
            balance: 5000.00.toString(),
            currency: 'NGN',
            accountNumber: generateAccountNumber(), // Use the generated account number
        }));

        await Wallet.insertMany(walletData);
        console.log(`${walletData.length} Wallets linked and inserted.`);

        console.log("Mass seeding complete!");

        process.exit();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();

