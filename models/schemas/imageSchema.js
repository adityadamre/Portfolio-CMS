import mongoose from 'mongoose';

// Reusable across Project (thumbnail, screenshots) and Blog content image blocks.
// Stores Cloudinary metadata only — no binary data.
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required.'],
      trim: true,
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required.'],
      trim: true,
    },
    alt: {
      type: String,
      default: '',
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
  },
  { _id: false },
);

export default imageSchema;
