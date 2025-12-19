const mongoose = require('mongoose');

const CuisineSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
  description: { type: String, required: true, trim: true },

  // Places - now references to CuisinePlace model
  places: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CuisinePlace' 
  }],

  // Media
  mainImages: [{ type: String, trim: true }],

  // Tips and Recipe
  tips: [{ type: String, trim: true }],
  recipe: { type: String, trim: true },

  // Meta
  avgRating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: String, enum: ['published', 'draft', 'hidden'], default: 'published', index: true },
  isActive: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CuisineSchema.index({ name: 'text', description: 'text' });
CuisineSchema.index({ featured: 1 });
CuisineSchema.index({ places: 1 });

// Auto-generate slug from name
CuisineSchema.pre('save', function(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    let baseSlug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    this.slug = baseSlug || ('cuisine-' + Date.now());
  }
  next();
});

// Virtuals
CuisineSchema.virtual('url').get(function() {
  return `/cuisine/${this.slug}`;
});
CuisineSchema.virtual('mainImage').get(function() {
  return this.mainImages?.[0] || null;
});

module.exports = mongoose.model('Cuisine', CuisineSchema);


