const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  id: String,
  name: String,
  rate: Number,
  qty: Number,
  qtyDisplay: String,
  unit: String,
  total: Number
}, { _id: false });

const entrySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  date: {
    type: String,
    required: true
  },
  items: [itemSchema],
  amount: {
    type: Number,
    required: true
  },
  particular: String,
  mode: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: String,
    required: true
  },
  entries: [entrySchema]
});

customerSchema.index({ shopId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);