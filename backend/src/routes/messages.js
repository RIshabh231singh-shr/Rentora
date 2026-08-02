const express = require('express');
const router = express.Router();
const { getContacts, getMessages, sendMessage } = require('../controllers/messageController');
const tenantAuthMiddleware = require('../middleware/tenantMiddleware');

router.get('/contacts', tenantAuthMiddleware, getContacts);
router.get('/:contactId', tenantAuthMiddleware, getMessages);
router.post('/send', tenantAuthMiddleware, sendMessage);

module.exports = router;
