const express = require('express');
const router = express.Router();

router.use(require('./users/_rest'));
router.use(require('./nursery/_rest'));
router.use(require('./distribution/_rest'));
router.use(require('./pmsurvived/_rest'));
//Add here

router.use(require('./download/_rest'));
router.use(require('./logs/_rest'));

module.exports = router;