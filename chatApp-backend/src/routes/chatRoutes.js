const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createChatSchema } = require('../validations/chat.validation');

router.use(protect);

router.get('/', chatController.getUserChats);

router.post('/', validate(createChatSchema), chatController.accessChat);

router.put('/:chatId/temp-mode', chatController.toggleTemporaryMode);

router.post('/group', chatController.createGroupChat);

router.put('/group/add', chatController.addToGroup);

router.put('/group/remove', chatController.removeFromGroup);

module.exports = router;
