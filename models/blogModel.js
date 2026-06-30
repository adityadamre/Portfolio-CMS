import mongoose from 'mongoose';
import contentBlockSchema from './schemas/contentBlockSchema.js';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Blog slug is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, 'An excerpt is required for card/preview display.'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Blog category is required.'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    readingTime: {
      type: Number,
      required: [true, 'Estimated reading time (in minutes) is required.'],
      min: [1, 'Reading time must be at least 1 minute.'],
    },
    content: {
      type: [contentBlockSchema],
      required: [true, 'Blog content blocks are required.'],
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
