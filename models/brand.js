// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define Brand schema
var BrandSchema = new Schema({
  _id: { type: String, unique: true },
  brand_name: { type: String, unique: true, required: true },
  brand_slug: { type: String, unique: true, required: true },
  brand_img: { type: String},
});

// Export Brand model
var collectionName = 'brand_tbl';
var Brand = mongoose.model('Brand', BrandSchema, collectionName);
module.exports = Brand;
