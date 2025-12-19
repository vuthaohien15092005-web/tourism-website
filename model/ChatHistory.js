const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true
    },
    session_id: {
      type: String,
      required: true,
      index: true
    },
    messages: [{
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    is_active: {
      type: Boolean,
      default: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Index để tối ưu truy vấn
chatHistorySchema.index({ user_id: 1, session_id: 1 });
chatHistorySchema.index({ user_id: 1, created_at: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema, "chat_histories");

module.exports = ChatHistory;
