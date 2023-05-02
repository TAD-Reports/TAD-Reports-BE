const express = require('express');
const router = express.Router();

router.use(require('./users/_rest'));
router.use(require('./classrooms/_rest'));

module.exports = router;