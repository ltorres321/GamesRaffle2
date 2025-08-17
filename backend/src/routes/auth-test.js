const express = require('express');
const router = express.Router();

// Simple test endpoint with no dependencies
router.post('/register', async (req, res) => {
  console.log('🚀 Test registration endpoint hit');
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    body: req.body
  });
});

module.exports = router;