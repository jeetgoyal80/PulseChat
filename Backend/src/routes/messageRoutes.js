const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { getMessagesSchema } = require('../validations/chat.validation');
const upload = require('../config/upload');

router.use(protect);

router.get('/:chatId', validate(getMessagesSchema), messageController.getMessages);
router.post('/:chatId', messageController.sendTextMessage);
router.post('/:chatId/media', upload.single('file'), messageController.uploadMedia);
router.put('/:messageId', messageController.editMessage);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
