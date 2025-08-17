const express = require('express');
const router = express.Router();

console.log('🚀 Auth-minimal module loading - version 2...');

// Simple test endpoint with no dependencies
router.post('/register', async (req, res) => {
  console.log('🚀 Minimal register endpoint hit');
  res.status(200).json({
    success: true,
    message: 'Minimal endpoint working',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

console.log('✅ Auth-minimal module loaded successfully');
module.exports = router;