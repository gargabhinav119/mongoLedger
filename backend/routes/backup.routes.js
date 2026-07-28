const express = require('express');
const { verifyShop } = require('../middleware/auth');
const Backup = require('../models/Backup');

const router = express.Router();

// Helper: Generate timestamp filename (exact match with v1)
function generateBackupFilename() {
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} - ${hours}.${minutes} ${ampm}.json`;
}

// Create backup
router.post('/', verifyShop, async (req, res) => {
  try {
    const data = req.body;
    const filename = generateBackupFilename();

    const backup = new Backup({
      shopId: req.shopId,
      filename: filename,
      data: data
    });

    await backup.save();

    res.json({
      success: true,
      filename: filename
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all backups for shop
router.get('/', verifyShop, async (req, res) => {
  try {
    const backups = await Backup.find({ shopId: req.shopId })
      .select('filename createdAt')
      .sort({ createdAt: -1 });

    res.json({ backups });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific backup
router.get('/:filename', verifyShop, async (req, res) => {
  try {
    const backup = await Backup.findOne({
      shopId: req.shopId,
      filename: req.params.filename
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.json({ data: backup.data });
  } catch (error) {
    console.error('Get backup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;