const express = require('express');
const router = express.Router();

router.use(require('./users/_rest'));
router.use(require('./classrooms/_rest'));
// router.use(require('./nursery/_rest'));
// router.use(require('./distribution/_rest'));

module.exports = router;