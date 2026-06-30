import mongoose from 'mongoose';
import imageSchema from './schemas/imageSchema.js';

const experienceSchema = new mongoose.Schema(
  {
    organization: {
      type: String,
      required: [true, 'Organization name is required.'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role/Job title is required.'],
      trim: true,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required.'],
      enum: {
        values: [
          'Full-time',
          'Part-time',
          'Internship',
          'Freelance',
          'Contract',
        ],
        message:
          'Employment type must be: Full-time, Part-time, Internship, Freelance, or Contract.',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required.'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required.'],
    },
    endDate: {
      type: Date,
    },
    current: {
      type: Boolean,
      default: false,
    },
    description: {
      type: [String],
      required: [true, 'At least one description point is required.'],
    },
    skills: {
      type: [String],
      default: [],
    },
    logo: {
      type: imageSchema,
    },
  },
  {
    timestamps: true,
  },
);

// Custom validation to ensure endDate is provided if not a current role
experienceSchema.pre('validate', function (next) {
  if (!this.current && !this.endDate) {
    this.invalidate(
      'endDate',
      'End date is required if this is not a current position.',
    );
  }
  next();
});

const Experience = mongoose.model('Experience', experienceSchema);

export default Experience;
