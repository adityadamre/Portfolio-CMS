import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

// Load env vars
dotenv.config({ path: './config.env' });

const seedAdmin = async () => {
  try {
    const DB = process.env.DATABASE?.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD || '',
    );

    if (!DB) {
      console.error('⚠️ DATABASE environment variable is missing.');
      process.exit(1);
    }

    await mongoose.connect(DB);
    console.log('✅ DB connection successful!');

    // Take credentials from CLI arguments, fallback to ENV, fallback to defaults
    const adminEmail =
      process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword =
      process.argv[3] || process.env.ADMIN_PASSWORD || 'password123';
    const adminName = process.argv[4] || process.env.ADMIN_NAME || 'Admin User';

    // Check if the admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`⚠️ Admin user with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    // Create the admin user (pre-save hook will hash the password)
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    });

    console.log(`✅ Admin user seeded successfully!`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
