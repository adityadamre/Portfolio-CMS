import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const { default: app } = await import('./app.js');

const DB = process.env.DATABASE?.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD || '',
);

if (DB) {
  mongoose
    .connect(DB)
    .then(() => console.log('✅ DB connection successful!'))
    .catch((err) => console.log('❌ DB connection failed:', err.message));
} else {
  console.log('⚠️ DATABASE not found in environment variables.');
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`,
  );
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
