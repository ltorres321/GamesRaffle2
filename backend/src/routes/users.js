const express = require('express');
const router = express.Router();

// User management routes will be implemented in the next phase
router.get('/', (req, res) => {
  res.json({ message: 'User routes - Coming soon' });
});

module.exports = router;