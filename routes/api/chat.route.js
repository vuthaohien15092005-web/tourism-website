const express = require('express');
const router = express.Router();
const chatController = require('../../controller/api/chat.controller');

// POST /api/chat - Gửi tin nhắn và nhận phản hồi
router.post('/chat', chatController.handleChatCompletion);

// GET /api/chat/history - Lấy lịch sử chat của user
router.get('/chat/history', chatController.getChatHistory);

// GET /api/chat/sessions - Lấy danh sách session của user
router.get('/chat/sessions', chatController.getUserSessions);

// DELETE /api/chat/session - Xóa session
router.delete('/chat/session', chatController.deleteSession);

// GET /api/chat/stats - Lấy thống kê hệ thống chatbot
router.get('/chat/stats', chatController.getSystemStats);

// POST /api/chat/test-template - Test template matching
router.post('/chat/test-template', chatController.testTemplateMatching);

module.exports = router;


