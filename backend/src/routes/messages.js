const express = require('express');
const router = express.Router();
const { getContacts, getMessages } = require('../controllers/messageController');
const tenantAuthMiddleware = require('../middleware/tenantmiddleware');

router.get('/contacts', tenantAuthMiddleware, getContacts);
router.get('/:contactId', tenantAuthMiddleware, getMessages);

module.exports = router;
