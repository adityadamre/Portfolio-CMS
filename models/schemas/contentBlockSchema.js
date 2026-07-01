import mongoose from 'mongoose';
import imageSchema from './imageSchema.js';

// Payload validators — enforce that each block type carries its required data.
const requireForType = (blockType, fieldLabel) =>
  function () {
    if (
      this.type === blockType &&
      (this[fieldLabel] === undefined || this[fieldLabel] === null)
    )
      return false;
    return true;
  };

const requireNonEmptyArrayForType = (blockType, fieldLabel) =>
  function () {
    if (this.type === blockType) {
      return Array.isArray(this[fieldLabel]) && this[fieldLabel].length > 0;
    }
    return true;
  };

/*
 * ContentBlockSchema — Sparse Payload Pattern
 *
 * Each block carries only the fields relevant to its type:
 *   paragraph → text
 *   list      → title + style + items
 *   image     → image (ImageSchema)
 *   note      → note.{ text, author?, variant }
 *
 * Extend by:
 *   1. Adding the new type to the `type` enum.
 *   2. Adding the new optional payload field(s) below.
 *   3. Adding a validator if the field is required for that type.
 *
 * Future types (not yet active): heading, code, callout, table, gallery
 */
const contentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Content block type is required.'],
      enum: {
        values: ['paragraph', 'list', 'image', 'note'],
        message: 'Block type "{VALUE}" is not supported.',
      },
    },
    title: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },

    // ── paragraph ──────────────────────────────────────────────────────────
    text: {
      type: String,
      trim: true,
      validate: {
        validator: requireForType('paragraph', 'text'),
        message: 'A paragraph block requires a non-empty "text" field.',
      },
    },

    // ── list ───────────────────────────────────────────────────────────────
    style: {
      type: String,
      enum: {
        values: ['unordered', 'ordered'],
        message: 'List style must be "ordered" or "unordered".',
      },
      default: 'unordered',
    },
    items: {
      type: [String],
      validate: {
        validator: requireNonEmptyArrayForType('list', 'items'),
        message: 'A list block requires at least one item in "items".',
      },
    },

    // ── image ──────────────────────────────────────────────────────────────
    image: {
      type: imageSchema,
      validate: {
        validator: requireForType('image', 'image'),
        message: 'An image block requires a valid "image" object.',
      },
    },

    // ── note ───────────────────────────────────────────────────────────────
    note: {
      type: new mongoose.Schema(
        {
          content: {
            type: String,
            required: [true, 'Note text is required.'],
            trim: true,
          },
          author: {
            type: String,
            trim: true,
          },
          variant: {
            type: String,
            enum: {
              values: [
                'default',
                'aside',
                'tip',
                'pitfall',
                'conclusion',
                'quote',
              ],
              message: 'Note variant "{VALUE}" is not supported.',
            },
            default: 'default',
          },
        },
        { _id: false },
      ),
      validate: {
        validator: requireForType('note', 'note'),
        message:
          'A note block requires a valid "note" object with non-empty text.',
      },
    },

    // ── Future fields (add as needed) ──────────────────────────────────────
    // code: { language: String, code: String } → type: 'code'
  },
  { _id: false },
);

export default contentBlockSchema;
