const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

backupSchema.index({ shopId: 1, filename: 1 }, { unique: true });

module.exports = mongoose.model('Backup', backupSchema);