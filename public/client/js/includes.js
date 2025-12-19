(function () {
    function inject(selector, url) {
        var container = document.querySelector(selector);
        if (!container) return Promise.resolve();
        return fetch(url, { cache: 'no-cache' })
            .then(function (res) { return res.text(); })
            .then(function (html) {
                container.innerHTML = html;
            })
            .catch(function (e) { console.error('Include failed for', url, e); });
    }

    function loadPartials() {
        return Promise.all([
            inject('[data-include="header"]', 'partials/header.html'),
            inject('[data-include="footer"]', 'partials/footer.html')
        ]).then(function () {
            document.dispatchEvent(new CustomEvent('partials:loaded'));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPartials);
    } else {
        loadPartials();
    }
})();

// Minimal Chatbot widget (disabled if page provides .hnv-chat)
(function(){
    function createEl(tag, cls){ var el = document.createElement(tag); if (cls) el.className = cls; return el; }
    function mount(){
        if (document.querySelector('.hnv-chat')) return; // page-specific chat exists
        var root = document.getElementById('hnv-chatbot-root');
        if (!root) return;
        if (root.dataset.mounted) return; root.dataset.mounted = '1';

        var widget = createEl('div', 'hnv-chatbot');
        var btn = createEl('button', 'hnv-chatbot__toggle'); btn.type = 'button'; btn.innerHTML = 'Hỏi trợ lý';
        var panel = createEl('div', 'hnv-chatbot__panel');
        var header = createEl('div', 'hnv-chatbot__header'); 
        header.innerHTML = '<span>Chatbot</span><button class="hnv-chatbot__close" title="Đóng chat">×</button>';
        var body = createEl('div', 'hnv-chatbot__body');
        var form = createEl('form', 'hnv-chatbot__form');
        var input = createEl('input', 'hnv-chatbot__input'); input.placeholder = 'Nhập câu hỏi...'; input.autocomplete = 'off';
        var send = createEl('button', 'hnv-chatbot__send'); send.type = 'submit'; send.innerText = 'Gửi';
        form.appendChild(input); form.appendChild(send);
        panel.appendChild(header); panel.appendChild(body); panel.appendChild(form);
        widget.appendChild(btn); widget.appendChild(panel);
        root.appendChild(widget);

        function formatText(text) {
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

        function appendMsg(role, text){
            var row = createEl('div', 'hnv-chatbot__msg ' + (role === 'user' ? 'u' : 'a'));
            if (role === 'assistant') {
                row.innerHTML = formatText(text);
            } else {
                row.textContent = text;
            }
            body.appendChild(row); body.scrollTop = body.scrollHeight;
        }

        var open = false;
        function toggle(){ open = !open; widget.classList.toggle('open', open); if (open) input.focus(); }
        function close(){ open = false; widget.classList.remove('open'); }
        btn.addEventListener('click', toggle);
        header.addEventListener('click', toggle);
        
        // Thêm event listener cho nút đóng
        var closeBtn = header.querySelector('.hnv-chatbot__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                close();
            });
        }

        var history = [];
        var userId = localStorage.getItem('chat_user_id') || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        var sessionId = localStorage.getItem('chat_session_id') || 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Lưu user_id và session_id vào localStorage
        localStorage.setItem('chat_user_id', userId);
        localStorage.setItem('chat_session_id', sessionId);
        
        form.addEventListener('submit', function(e){
            e.preventDefault();
            var text = (input.value || '').trim(); if (!text) return;
            appendMsg('user', text); history.push({ role: 'user', content: text }); input.value = '';
            send.disabled = true; 
            send.innerText = '...';
            fetch('/api/chat', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    messages: history,
                    user_id: userId,
                    session_id: sessionId
                }) 
            })
                .then(function(r){ return r.json(); })
                .then(function(data){ var reply = (data && data.content) || 'Xin lỗi, có lỗi xảy ra.'; history.push({ role: 'assistant', content: reply }); appendMsg('assistant', reply); })
                .catch(function(){ appendMsg('assistant', 'Xin lỗi, máy chủ đang bận.'); })
                .finally(function(){ send.disabled = false; send.innerText = 'Gửi'; });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();