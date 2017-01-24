// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// Define product schema
var ProductSchema = new Schema({
  _id: { type: String, unique: true ,required: true },
  name: { type: String , required: true},
  brand: { type: String, required: true},
  category: { type: String, required: true},
  category_id: { type: String,ref:'Category'},
  size: { type: String},
  sku: { type: String},
  status: { type: String},
  gender: { type: String},
  date: { type: Date, default: Date.now },
  seller:{ type: String},

  pricing: {
    retail: { type: Number, required: true},
    sale: { type: Number, required: true},
    stock: { type: Number, required: true},
  },

  details: {
    description: { type: String},
    short_description: { type: String, required: true}
  },

  shipping: {
    weight: { type: String},
    length: { type: String},
    breadth: { type: String},
    height: { type: String}
  },

  image: [ {img: {type: String, required: true} }]

});

// Export product model
var collectionName = 'product_tbl';
var Product = mongoose.model('Product', ProductSchema, collectionName);
module.exports = Product;
