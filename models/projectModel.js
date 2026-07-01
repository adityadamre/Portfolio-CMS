import mongoose from 'mongoose';
import imageSchema from './schemas/imageSchema.js';
import contentBlockSchema from './schemas/contentBlockSchema.js';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Project slug is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      required: [
        true,
        'A short description is required for card/preview display.',
      ],
      trim: true,
    },
    thumbnail: {
      type: imageSchema,
      required: [true, 'Project thumbnail is required.'],
    },
    screenshots: {
      type: [imageSchema],
      default: [],
    },
    content: {
      type: [contentBlockSchema],
      required: [true, 'Project content blocks are required.'],
    },
    techStack: {
      type: [String],
      required: [
        true,
        'At least one technology must be specified in the tech stack.',
      ],
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    liveUrl: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
