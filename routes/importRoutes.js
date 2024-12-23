const express = require('express');
const importController = require('../controllers/importController');
const multer = require('multer');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });  // Save the uploaded file to 'uploads/' directory


// Define the POST route for creating import containers
// You can now pass `region` and `projectKey` in the request body instead of the URL
router.post('/container', importController.createImportContainer);

router.post('/categories', upload.single('file'),importController.createImportCategories);

router.post('/inventory', upload.single('file'),importController.createImportInventory);

router.post('/orders', upload.single('file'),importController.createImportOrders);

module.exports = router;
