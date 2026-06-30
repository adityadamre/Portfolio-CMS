import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required.'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required.'],
      trim: true,
    },
    slug: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
