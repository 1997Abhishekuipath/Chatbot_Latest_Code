const express = require('express');
const router = express.Router();
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const WebhookController = require('../controllers/webhook');
const webhookController = new WebhookController();

router.post('/notification/fetch', webhookController.fetchNotifications);
router.post('/notification/update', webhookController.updateNotifications);
router.post('/notification/approval', webhookController.approveNotification);
router.post('/notification/confirm', webhookController.confirmNotification);
router.post('/service', webhookController.execute);
router.post('/file_upload', upload.any(),webhookController.file_execute);


module.exports = router;