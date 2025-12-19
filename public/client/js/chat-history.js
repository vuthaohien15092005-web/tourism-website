/**
 * Chat History Management
 * Quản lý lịch sử chat và session cho user
 */

class ChatHistoryManager {
    constructor() {
        this.userId = null;
        this.currentSessionId = null;
        this.chatContainer = null;
        this.historyContainer = null;
        this.sessionsContainer = null;
        
        this.init();
    }

    init() {
        // Lấy user ID từ localStorage hoặc session
        this.userId = localStorage.getItem('user_id') || this.generateUserId();
        this.currentSessionId = this.generateSessionId();
        
        // Tạo UI elements
        this.createHistoryUI();
        this.loadUserSessions();
    }

    generateUserId() {
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
        return userId;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createHistoryUI() {
        // Tạo sidebar cho lịch sử chat
        const sidebar = document.createElement('div');
        sidebar.id = 'chat-history-sidebar';
        sidebar.innerHTML = `
            <div class="chat-history-header">
                <h3>Lịch sử chat</h3>
                <button id="new-chat-btn" class="new-chat-btn">Cuộc trò chuyện mới</button>
            </div>
            <div id="sessions-list" class="sessions-list">
                <!-- Danh sách session sẽ được load ở đây -->
            </div>
        `;

        // Thêm CSS
        const style = document.createElement('style');
        style.textContent = `
            #chat-history-sidebar {
                position: fixed;
                left: -300px;
                top: 0;
                width: 300px;
                height: 100vh;
                background: #f8f9fa;
                border-right: 1px solid #dee2e6;
                transition: left 0.3s ease;
                z-index: 3000; /* Lịch sử chat cao hơn chat panel */
                overflow-y: auto;
            }
            
            #chat-history-sidebar.open {
                left: 0;
            }
            
            .chat-history-header {
                padding: 20px;
                border-bottom: 1px solid #dee2e6;
                background: white;
            }
            
            .chat-history-header h3 {
                margin: 0 0 15px 0;
                color: #333;
            }
            
            .new-chat-btn {
                width: 100%;
                padding: 10px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .new-chat-btn:hover {
                background: #0056b3;
            }
            
            .sessions-list {
                padding: 10px;
            }
            
            .session-item {
                padding: 12px;
                margin-bottom: 8px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e9ecef;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .session-item:hover {
                background: #e9ecef;
                border-color: #007bff;
            }
            
            .session-item.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            
            .session-preview {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .session-item.active .session-preview {
                color: rgba(255, 255, 255, 0.8);
            }
            
            .session-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 5px;
                font-size: 11px;
            }
            
            .session-date {
                color: #999;
            }
            
            .session-item.active .session-date {
                color: rgba(255, 255, 255, 0.7);
            }
            
            .session-actions {
                display: flex;
                gap: 5px;
            }
            
            .session-delete-btn {
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 10px;
                cursor: pointer;
            }
            
            .session-delete-btn:hover {
                background: #c82333;
            }
            
            .history-toggle-btn {
                position: fixed;
                left: 20px;
                top: 20px;
                z-index: 1001;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            .history-toggle-btn:hover {
                background: #0056b3;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(sidebar);

        // Tạo nút toggle
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'history-toggle-btn';
        toggleBtn.innerHTML = '📋';
        toggleBtn.title = 'Xem lịch sử chat';
        document.body.appendChild(toggleBtn);

        // Event listeners
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        document.getElementById('new-chat-btn').addEventListener('click', () => {
            this.startNewSession();
        });
    }

    async loadUserSessions() {
        try {
            const response = await fetch(`/api/chat/sessions?user_id=${this.userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderSessions(data.data);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    renderSessions(sessions) {
        const container = document.getElementById('sessions-list');
        
        if (sessions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Chưa có cuộc trò chuyện nào</p>';
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-item" data-session-id="${session.session_id}">
                <div class="session-preview">${session.preview}</div>
                <div class="session-meta">
                    <span class="session-date">${this.formatDate(session.updated_at)}</span>
                    <div class="session-actions">
                        <span>${session.message_count} tin nhắn</span>
                        <button class="session-delete-btn" onclick="chatHistoryManager.deleteSession('${session.session_id}')">×</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Thêm event listeners cho session items
        container.querySelectorAll('.session-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('session-delete-btn')) return;
                
                const sessionId = item.dataset.sessionId;
                this.loadSession(sessionId);
            });
        });
    }

    async loadSession(sessionId) {
        try {
            const response = await fetch(`/api/chat/history?user_id=${this.userId}&session_id=${sessionId}`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                this.currentSessionId = sessionId;
                this.displaySessionMessages(data.data[0].messages);
                this.updateActiveSession(sessionId);
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }

    formatText(text) {
        // Xóa các ký tự markdown (*, **, __, etc.)
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold** -> bold
        text = text.replace(/\*([^*]+)\*/g, '$1'); // *italic* -> italic
        text = text.replace(/__([^_]+)__/g, '$1'); // __bold__ -> bold
        text = text.replace(/_([^_]+)_/g, '$1'); // _italic_ -> italic
        text = text.replace(/~~([^~]+)~~/g, '$1'); // ~~strikethrough~~ -> strikethrough
        text = text.replace(/`([^`]+)`/g, '$1'); // `code` -> code
        
        // Xử lý xuống dòng và căn chỉnh
        text = text.replace(/\n\n/g, '<br><br>'); // Double newlines -> paragraph breaks
        text = text.replace(/\n/g, '<br>'); // Single newlines -> line breaks
        
        return text;
    }

    displaySessionMessages(messages) {
        // Tìm chat container (giả sử có sẵn)
        const chatContainer = document.querySelector('.chat-messages') || document.querySelector('#chat-container');
        
        if (!chatContainer) {
            console.warn('Chat container not found');
            return;
        }

        // Clear current messages
        chatContainer.innerHTML = '';

        // Render messages
        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.role}`;
            
            const content = message.role === 'assistant' ? 
                this.formatText(message.content) : 
                message.content;
                
            messageDiv.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-time">${this.formatDate(message.timestamp)}</div>
            `;
            chatContainer.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    updateActiveSession(sessionId) {
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.sessionId === sessionId) {
                item.classList.add('active');
            }
        });
    }

    startNewSession() {
        this.currentSessionId = this.generateSessionId();
        this.updateActiveSession(this.currentSessionId);
        
        // Clear chat container
        const chatContainer = document.querySelector('.chat-messages') || document.querySelector('#chat-container');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }
    }

    async deleteSession(sessionId) {
        if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
            return;
        }

        try {
            const response = await fetch('/api/chat/session', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    session_id: sessionId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.loadUserSessions();
                
                // Nếu đang xem session bị xóa, tạo session mới
                if (this.currentSessionId === sessionId) {
                    this.startNewSession();
                }
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    }

    // Method để gửi tin nhắn với session tracking
    async sendMessage(message, messages = []) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    user_id: this.userId,
                    session_id: this.currentSessionId
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            return { role: 'assistant', content: 'Xin lỗi, đã xảy ra lỗi khi gửi tin nhắn.' };
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Hôm nay';
        } else if (diffDays === 2) {
            return 'Hôm qua';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    }
}

// Khởi tạo Chat History Manager
window.chatHistoryManager = new ChatHistoryManager();

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatHistoryManager;
}
