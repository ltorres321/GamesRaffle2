const express = require('express');
const router = express.Router();

// Game management routes will be implemented in the next phase
router.get('/', (req, res) => {
  res.json({ message: 'Game routes - Coming soon' });
});

module.exports = router;