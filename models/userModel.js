import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving if it has been modified.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Record password change timestamp (used to invalidate old JWTs).
userSchema.pre('save', function () {
  if (!this.isModified('password') || this.isNew) return;
  // Subtract 1s to account for token-issuance delay
  this.passwordChangedAt = Date.now() - 1000;
});

// Compare a candidate password against the stored hash.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  hashedPassword,
) {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

// Check if the password was changed after a given JWT timestamp.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedAt;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;
