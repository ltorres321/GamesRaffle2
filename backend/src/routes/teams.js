const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Teams routes - Coming soon' });
});

module.exports = router;