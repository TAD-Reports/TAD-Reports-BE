const express = require('express');
const router = express.Router();
const { errorHandler } = require("../middlewares/errors");
router.use(require('./users/_rest'));
router.use(require('./nursery/_rest'));
router.use(require('./distribution/_rest'));
router.use(require('./pmsurvived/_rest'));
router.use(require('./training/_rest'));
router.use(require('./iecmaterials/_rest'));
// router.use(require('./iecmaterials/_rest'));
//Add here
router.use(errorHandler);
router.use(require('./download/_rest'));
router.use(require('./logs/_rest'));

module.exports = router;