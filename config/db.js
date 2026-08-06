import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const DB = process.env.DATABASE?.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD || '',
    );

    if (!DB) {
      console.log('⚠️ DATABASE not found in environment variables.');
      return;
    }

    await mongoose.connect(DB);
    console.log('✅ DB connection successful!');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;
