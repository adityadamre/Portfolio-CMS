import { Readable } from 'stream';
import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload a single image from Multer memory storage to Cloudinary.
 * @param {Object} file - The file object from Multer (must contain a buffer).
 * @param {String} folder - The Cloudinary folder path to upload the asset into.
 * @returns {Promise<Object>} An object matching the ImageSchema format.
 */

export const uploadImage = (file, folder) => {
  return new Promise((resolve, reject) => {
    // If no file is provided, resolve null gracefully
    if (!file || !file.buffer) return resolve(null);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);

        // Return an object that perfectly maps to our reusable imageSchema
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );

    // Stream the memory buffer directly to Cloudinary
    Readable.from(file.buffer).pipe(uploadStream);
  });
};

/**
 * Upload multiple images concurrently.
 * @param {Array} files - Array of file objects from Multer.
 * @param {String} folder - The Cloudinary folder path.
 * @returns {Promise<Array>} Array of objects matching the ImageSchema format.
 */

export const uploadImages = async (files, folder) => {
  if (!files || !Array.isArray(files) || files.length === 0) return [];

  // Map files to upload promises and await them concurrently
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete a single image from Cloudinary using its public ID.
 * @param {String} publicId - The Cloudinary public_id of the asset.
 * @returns {Promise<Object>} The Cloudinary destroy result.
 */
export const deleteImage = async (publicId) => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple images from Cloudinary concurrently.
 * @param {Array} publicIds - Array of Cloudinary public_ids.
 * @returns {Promise<Array>} Array of Cloudinary destroy results.
 */

export const deleteImages = async (publicIds) => {
  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0)
    return [];

  // Map publicIds to deletion promises and await them concurrently
  const deletePromises = publicIds.map((id) => deleteImage(id));
  return Promise.all(deletePromises);
};

/**
 * Reusable helper to synchronize an array of images during a PATCH request.
 * @param {Array} existingImages - Images currently in the DB.
 * @param {Array} payloadImages - Desired final state images from frontend (parsed JSON).
 * @param {Array} newFiles - Multer file objects for new uploads.
 * @param {String} folder - Cloudinary folder path.
 * @param {Array} newFilesMeta - Array of metadata objects for the new uploads.
 * @returns {Promise<{ finalImages: Array, imagesToDelete: Array, newlyUploadedPublicIds: Array }>}
 */

export const syncImageArray = async (
  existingImages = [],
  payloadImages = [],
  newFiles = [],
  folder,
  newFilesMeta = []
) => {
  const payloadPublicIds = payloadImages
    .map((img) => img.publicId)
    .filter(Boolean);

  // 1. Identify existing images kept by the user
  const keptImages = existingImages.filter((img) =>
    payloadPublicIds.includes(img.publicId)
  );

  // 2. Identify existing images removed (to be deleted from Cloudinary later)
  const imagesToDelete = existingImages.filter(
    (img) => !payloadPublicIds.includes(img.publicId)
  );

  // 3. Upload new files concurrently
  const uploadedImages = await uploadImages(newFiles, folder);
  const newlyUploadedPublicIds = uploadedImages.map((img) => img.publicId).filter(Boolean);

  // 4. Construct final array based on frontend order
  let uploadIndex = 0;
  const finalImages = payloadImages
    .map((payloadImg) => {
      if (payloadImg.publicId) {
        const kept = keptImages.find((k) => k.publicId === payloadImg.publicId);
        if (kept) {
          const keptObj = kept.toObject ? kept.toObject() : kept;
          return {
            ...keptObj,
            alt: payloadImg.alt !== undefined ? payloadImg.alt : keptObj.alt,
            caption: payloadImg.caption !== undefined ? payloadImg.caption : keptObj.caption,
          };
        }
        return null;
      } else {
        const newImg = uploadedImages[uploadIndex];
        const newImgMeta = Array.isArray(newFilesMeta) ? newFilesMeta[uploadIndex] : {};
        uploadIndex++;
        if (newImg) {
          return {
            ...newImg,
            alt: newImgMeta?.alt || payloadImg.alt || '',
            caption: newImgMeta?.caption || payloadImg.caption || '',
          };
        }
        return null;
      }
    })
    .filter(Boolean);

  // Append any unmapped uploads just in case
  while (uploadIndex < uploadedImages.length) {
    finalImages.push(uploadedImages[uploadIndex++]);
  }

  return { finalImages, imagesToDelete, newlyUploadedPublicIds };
};

/**
 * Recursively extracts all Cloudinary publicIds from a Mongoose document.
 * Extremely robust for DELETE operations (finds thumbnails, galleries, and nested content blocks).
 * @param {Object} doc - The plain JavaScript object of the MongoDB document (use .toObject() or .lean()).
 * @returns {Array<String>} Array of publicIds.
 */

export const extractPublicIds = (doc) => {
  const ids = [];
  const traverse = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object') {
      if (obj.publicId && typeof obj.publicId === 'string') {
        ids.push(obj.publicId);
      }
      Object.values(obj).forEach(traverse);
    }
  };
  traverse(doc);
  return ids;
};

/**
 * Synchronizes image blocks within a complex content array.
 * @param {Array} existingContent - The content array currently in the DB.
 * @param {Array} payloadContent - The parsed JSON content array from the frontend.
 * @param {Array} newContentFiles - The Multer file objects (req.files.contentImages).
 * @param {String} folder - Cloudinary folder path.
 * @param {Array} newContentFilesMeta - Array of metadata objects for new images.
 * @returns {Promise<{ finalContent: Array, imagesToDelete: Array, newlyUploadedPublicIds: Array }>}
 */

export const syncContentBlocks = async (
  existingContent = [],
  payloadContent = [],
  newContentFiles = [],
  folder,
  newContentFilesMeta = []
) => {
  const imagesToDelete = [];

  // 1. Find existing and kept publicIds
  const existingPublicIds = existingContent
    .filter((block) => block.type === 'image' && block.image?.publicId)
    .map((block) => block.image.publicId);

  const keptPublicIds = payloadContent
    .filter((block) => block.type === 'image' && block.image?.publicId)
    .map((block) => block.image.publicId);

  existingPublicIds.forEach((id) => {
    if (!keptPublicIds.includes(id)) imagesToDelete.push(id);
  });

  // 2. Upload new files concurrently
  const uploadedImages = await uploadImages(newContentFiles, folder);
  const newlyUploadedPublicIds = uploadedImages.map((img) => img.publicId).filter(Boolean);

  // 3. Reconstruct final content array
  const finalContent = payloadContent.map((block) => {
    if (block.type !== 'image') return block;

    if (block.image?.publicId) {
      // Kept image
      const existingBlock = existingContent.find(
        (b) => b.type === 'image' && b.image?.publicId === block.image.publicId
      );
      if (existingBlock) {
        const existingImgObj = existingBlock.image.toObject ? existingBlock.image.toObject() : existingBlock.image;
        return {
          ...block,
          image: {
            ...existingImgObj,
            alt: block.image.alt !== undefined ? block.image.alt : existingImgObj.alt,
            caption: block.image.caption !== undefined ? block.image.caption : existingImgObj.caption,
          },
        };
      }
    } else if (block.imageIndex !== undefined) {
      // New image mapped by index
      const newImg = uploadedImages[block.imageIndex];
      const newImgMeta = Array.isArray(newContentFilesMeta) ? newContentFilesMeta[block.imageIndex] : {};
      
      if (newImg) {
        const resultBlock = { ...block };
        delete resultBlock.imageIndex;
        
        resultBlock.image = {
          ...newImg,
          alt: newImgMeta?.alt || block.image?.alt || '',
          caption: newImgMeta?.caption || block.image?.caption || '',
        };
        return resultBlock;
      }
    }
    return block;
  });

  return { finalContent, imagesToDelete, newlyUploadedPublicIds };
};
