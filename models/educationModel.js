import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      required: [true, 'Institution name is required.'],
      trim: true,
    },
    degree: {
      type: String,
      required: [true, 'Degree is required.'],
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade (CGPA, Percentage, etc.) is required.'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required.'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required.'],
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Education = mongoose.model('Education', educationSchema);

export default Education;
