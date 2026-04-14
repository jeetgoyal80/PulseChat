const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { updatePrivacySchema } = require('../validations/user.validation');
const upload = require('../config/upload');

router.use(protect);

router.put('/settings/privacy', validate(updatePrivacySchema), userController.updatePrivacySettings);
router.get('/', userController.searchUsers);

router.put('/profile', upload.single('avatar'), userController.updateProfile);
router.delete('/account', userController.deleteAccount);

router.get('/blocked', userController.getBlockedUsers);
router.put('/block', userController.blockUser);
router.put('/unblock', userController.unblockUser);

module.exports = router;
