import mongoose from 'mongoose';
import imageSchema from './schemas/imageSchema.js';

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: [true, 'Platform name is required (e.g. GitHub, LinkedIn).'],
      trim: true,
    },
    icon: {
      // Slug for frontend icon resolution (e.g. 'github', 'linkedin', 'twitter')
      type: String,
      trim: true,
      lowercase: true,
    },
    url: {
      type: String,
      required: [true, 'Social link URL is required.'],
      trim: true,
    },
  },
  { _id: false },
);

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
    },
    headline: {
      type: String,
      required: [true, 'Headline is required (e.g. "Full-Stack Developer").'],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required.'],
      trim: true,
    },
    longDescription: {
      type: [String],
      default: [],
    },
    avatar: {
      type: imageSchema,
    },
    location: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Enforce singleton — only one Profile document may exist.
profileSchema.pre('save', async function () {
  if (this.isNew) {
    const existing = await mongoose.model('Profile').findOne();
    if (existing) {
      throw new Error('A Profile document already exists. Use update instead.');
    }
  }
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
