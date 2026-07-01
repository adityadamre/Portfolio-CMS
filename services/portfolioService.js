import Profile from '../models/profileModel.js';
import Education from '../models/educationModel.js';
import Experience from '../models/experienceModel.js';
import Skill from '../models/skillModel.js';
import Project from '../models/projectModel.js';
import Blog from '../models/blogModel.js';

export const getPortfolioData = async () => {
  // Fetch independent collections concurrently to minimize response time
  const [profile, education, experience, skills, projects, blogs] =
    await Promise.all([
      // Profile is a singleton, so we just fetch the first document
      Profile.findOne().lean(),

      // Usually sorted by most recent first
      Education.find().sort({ startDate: -1 }).lean(),

      // Experiences sorted by most recent first
      Experience.find().sort({ startDate: -1 }).lean(),

      // Skills sorted by their defined order
      Skill.find().sort({ order: 1 }).lean(),

      // Projects: featured only, specific fields
      Project.find({ featured: true })
        .select(
          'title slug thumbnail shortDescription githubUrl liveUrl techStack order',
        )
        .sort({ order: 1 }) // Sorted by order
        .lean(),

      // Blogs: latest 3 published, specific fields
      Blog.find({ publishedAt: { $ne: null } }) // Only fetch published blogs
        .select('title excerpt slug publishedAt category')
        .sort({ publishedAt: -1 }) // Descending order
        .limit(3)
        .lean(),
    ]);

  return {
    profile,
    education,
    experience,
    skills,
    projects,
    blogs,
  };
};
