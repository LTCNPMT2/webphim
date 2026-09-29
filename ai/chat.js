/* =========================================================
   1. CẤU HÌNH, TRẠNG THÁI & CÁC PHẦN TỬ DOM
   ========================================================= */

const MAX_COMPOSER_HEIGHT = 132;

const readChats = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('starfly_chats') || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
};

const state = {
    chats: readChats(),
    currentChatId: null,
    isGenerating: false,
    isListening: false,
    isSpeaking: false,
    voiceMode: false,
    voiceModeEnabled: localStorage.getItem('starfly_voice_enabled') !== 'false',
    voiceVolume: Number(localStorage.getItem('starfly_tts_volume')) || 1,
    autoListen: localStorage.getItem('starfly_auto_listen') !== 'false',
    ttsVoice: localStorage.getItem('starfly_tts_voice') || '',
    ttsSpeed: Number(localStorage.getItem('starfly_tts_speed')) || 1,
    theme: localStorage.getItem('starfly_theme') === 'light' ? 'light' : 'dark',
    interfaceBrightness: Number(localStorage.getItem('starfly_interface_brightness')) || 100,
    backgroundBrightness: Number(localStorage.getItem('starfly_background_brightness')) || 100
};

const elements = {
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    chatHistoryList: document.getElementById('chat-history-list'),
    messagesContainer: document.getElementById('messages-container'),
    welcomeScreen: document.getElementById('welcome-screen'),
    chatForm: document.getElementById('chat-form'),
    userInput: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    sttBtn: document.getElementById('stt-btn'),
    voiceStatus: document.getElementById('voice-status'),
    voiceStatusTitle: document.getElementById('voice-status-title'),
    voiceStatusDetail: document.getElementById('voice-status-detail'),
    settingsModal: document.getElementById('settings-modal'),
    settingsToggleBtn: document.getElementById('settings-toggle-btn'),
    clearChatBtn: document.getElementById('clear-chat-btn'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    ttsVoiceSelect: document.getElementById('tts-voice-select'),
    ttsSpeedInput: document.getElementById('tts-speed'),
    ttsSpeedVal: document.getElementById('tts-speed-val'),
    ttsVolumeInput: document.getElementById('tts-volume'),
    ttsVolumeVal: document.getElementById('tts-volume-val'),
    voiceModeEnabled: document.getElementById('voice-mode-enabled'),
    autoListen: document.getElementById('auto-listen'),
    interfaceBrightness: document.getElementById('interface-brightness'),
    interfaceBrightnessValue: document.getElementById('interface-brightness-value'),
    backgroundBrightness: document.getElementById('background-brightness'),
    backgroundBrightnessValue: document.getElementById('background-brightness-value'),
    themeInputs: document.querySelectorAll('input[name="theme"]'),
    resetAppearanceBtn: document.getElementById('reset-appearance-btn')
};

const synth = window.speechSynthesis;
let voices = [];

function applyAppearance() {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#10141c');
    document.documentElement.style.setProperty('--interface-brightness', `${state.interfaceBrightness}%`);
    document.documentElement.style.setProperty('--background-brightness', `${state.backgroundBrightness}%`);
    elements.interfaceBrightness.value = state.interfaceBrightness;
    elements.interfaceBrightnessValue.textContent = `${state.interfaceBrightness}%`;
    elements.backgroundBrightness.value = state.backgroundBrightness;
    elements.backgroundBrightnessValue.textContent = `${state.backgroundBrightness}%`;
    elements.themeInputs.forEach(input => { input.checked = input.value === state.theme; });
}

function saveAppearance() {
    localStorage.setItem('starfly_theme', state.theme);
    localStorage.setItem('starfly_interface_brightness', state.interfaceBrightness);
    localStorage.setItem('starfly_background_brightness', state.backgroundBrightness);
}

function saveChats() {
    localStorage.setItem('starfly_chats', JSON.stringify(state.chats));
}

function currentChat() {
    return state.chats.find(chat => chat.id === state.currentChatId);
}

function createNewChat() {
    const chat = { id: Date.now().toString(), title: 'New conversation', messages: [] };
    state.chats.unshift(chat);
    state.currentChatId = chat.id;
    saveChats();
    renderHistory();
    renderMessages();
    closeSidebar();
}

function renderHistory() {
    elements.chatHistoryList.replaceChildren();
    if (state.chats.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = 'Your conversations will appear here';
        elements.chatHistoryList.appendChild(empty);
        return;
    }
    state.chats.forEach(chat => {
        const item = document.createElement('button');
        item.className = `history-item${chat.id === state.currentChatId ? ' active' : ''}`;
        item.innerHTML = '<i class="fa-regular fa-message"></i>';
        const title = document.createElement('span');
        title.textContent = chat.title;
        const remove = document.createElement('i');
        remove.className = 'fa-solid fa-trash history-delete';
        remove.setAttribute('aria-label', 'Delete conversation');
        item.append(title, remove);
        item.addEventListener('click', event => {
            if (event.target === remove) {
                state.chats = state.chats.filter(entry => entry.id !== chat.id);
                if (state.currentChatId === chat.id) state.currentChatId = state.chats[0]?.id || null;
                saveChats();
                renderHistory();
                renderMessages();
                return;
            }
            state.currentChatId = chat.id;
            renderHistory();
            renderMessages();
            closeSidebar();
        });
        elements.chatHistoryList.appendChild(item);
    });
}

/* =========================================================
   2. HIỂN THỊ TIN NHẮN
   ========================================================= */

/*
   Làm sạch ký hiệu Markdown để Starfly trả lời như lời nói bình thường.
   Dấu câu . , ? ! : ; được giữ nguyên.
*/
function normalizeAssistantText(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/\r\n/g, '\n')
        .replace(/^[ \t]*```[a-zA-Z0-9_-]*[ \t]*$/gm, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^[ \t]{0,3}([-*_])[ \t]*\1[ \t]*\1[-*_ \t]*$/gm, '')
        .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/(^|\s)\*(\S[^*\n]*\S)\*(?=[\s.,?!:;]|$)/g, '$1$2')
        .replace(/^[ \t]{0,3}[-*+][ \t]+/gm, '• ')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/*
   Một tin nhắn chỉ tạo DUY NHẤT một text node.
   Không tách từ, không tách câu, không tự thêm <br>.
   Việc xuống dòng do người dùng nhập (Enter) hoặc do CSS tự wrap.
*/
function setMessageText(bubble, text) {
    bubble.textContent = text;
}

function updateVoiceStatus(detail = 'Bấm "Nói chuyện" để trò chuyện bằng giọng nói', forceVisible = false) {
    elements.voiceStatus.hidden = !state.voiceMode && !forceVisible;
    elements.voiceStatus.classList.toggle('speaking', state.isSpeaking);
    document.body.classList.toggle('voice-speaking', state.isSpeaking);
    elements.voiceStatusTitle.textContent = state.isSpeaking
        ? 'Đang nói...'
        : state.isGenerating
            ? 'Đang suy nghĩ...'
            : state.isListening
                ? 'Đang lắng nghe...'
                : 'Sẵn sàng';
    elements.voiceStatusDetail.textContent = detail;
    elements.sttBtn.classList.toggle('listening', state.isListening);
    const sttLabel = state.voiceMode ? 'Tắt microphone' : 'Nói chuyện';
    elements.sttBtn.setAttribute('aria-label', sttLabel);
    elements.sttBtn.title = sttLabel;
}

/* Ưu tiên giọng tiếng Việt khi người dùng chưa chọn giọng đọc. */
function resolveSpeechVoice() {
    const savedVoice = voices.find(item => item.name === state.ttsVoice);
    if (savedVoice) return savedVoice;
    return voices.find(item => (item.lang || '').toLowerCase().startsWith('vi')) || null;
}

function speakText(text, conversation = false) {
    if (!synth) return;
    synth.cancel();
    state.isSpeaking = Boolean(conversation);
    if (state.isSpeaking) {
        stopRecognition();
        updateVoiceStatus('Starfly đang trả lời');
        document.querySelector('.hero-orbit')?.classList.add('speaking');
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = state.ttsSpeed;
    utterance.volume = state.voiceVolume;
    const voice = resolveSpeechVoice();
    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || utterance.lang;
    }
    utterance.onstart = () => {
        if (conversation) updateVoiceStatus('Starfly đang trả lời');
    };
    utterance.onend = () => {
        if (!conversation) return;
        state.isSpeaking = false;
        document.querySelector('.hero-orbit')?.classList.remove('speaking');
        updateVoiceStatus('Starfly đang lắng nghe');
        resumeVoiceListening();
    };
    utterance.onerror = () => {
        if (!conversation) return;
        state.isSpeaking = false;
        document.querySelector('.hero-orbit')?.classList.remove('speaking');
        updateVoiceStatus('Không thể phát giọng nói, Starfly vẫn đang lắng nghe');
        resumeVoiceListening();
    };
    synth.speak(utterance);
}

function createMessageRow(role) {
    const isUser = role === 'user';

    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user' : 'assistant'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fa-solid fa-user"></i>' : '<img src="assets/starfly-logo.png" alt="Starfly">';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    content.appendChild(bubble);

    row.append(avatar, content);
    return { row, bubble, content };
}

/* Tin nhắn người dùng: đúng một bubble, nội dung giữ nguyên như đã nhập. */
function addUserMessage(text) {
    const { row, bubble } = createMessageRow('user');
    setMessageText(bubble, text);
    elements.messagesContainer.appendChild(row);
}

/* Tin nhắn của Starfly: đúng một bubble, đã làm sạch ký hiệu Markdown. */
function addAssistantMessage(text) {
    const { row, bubble, content } = createMessageRow('assistant');
    const cleanText = normalizeAssistantText(text);
    setMessageText(bubble, cleanText);

    const tools = document.createElement('div');
    tools.className = 'message-tools';

    const readButton = document.createElement('button');
    readButton.type = 'button';
    readButton.innerHTML = '<i class="fa-solid fa-volume-high"></i> Đọc lại';
    readButton.addEventListener('click', () => speakText(cleanText));
    tools.appendChild(readButton);
    content.appendChild(tools);

    elements.messagesContainer.appendChild(row);
}

/* Ba chấm chờ câu trả lời. Trả về phần tử để xoá sau khi có kết quả. */
function addTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-row assistant';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<img src="assets/starfly-logo.png" alt="Starfly">';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble typing-bubble';
    for (let index = 0; index < 3; index += 1) {
        bubble.appendChild(document.createElement('span'));
    }

    row.append(avatar, bubble);
    elements.messagesContainer.appendChild(row);
    return row;
}

function renderMessages() {
    const chat = currentChat();
    elements.messagesContainer.replaceChildren();
    if (!chat || chat.messages.length === 0) {
        elements.messagesContainer.appendChild(elements.welcomeScreen);
        elements.welcomeScreen.classList.remove('hidden');
        return;
    }
    elements.welcomeScreen.classList.add('hidden');
    chat.messages.forEach(message => {
        if (message.role === 'user') {
            addUserMessage(message.content);
            return;
        }
        addAssistantMessage(message.content);
    });
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

async function respondTo(chat, userMessage, voiceRequest = false) {
    state.isGenerating = true;
    updateVoiceStatus('Starfly đang xử lý câu hỏi', voiceRequest);
    elements.sendBtn.disabled = true;
    const typing = addTypingIndicator();
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    try {
        const normalizedRequest = userMessage.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        if (/\b(dat ve|mua ve|book ticket)\b/.test(normalizedRequest)) {
            const configuredBase = typeof window.STARFLY_API_BASE_URL === 'string' ? window.STARFLY_API_BASE_URL.replace(/\/$/, '') : '';
            const moviesUrl = configuredBase
                ? `${configuredBase}/api/movies`
                : window.location.protocol === 'file:' ? 'http://localhost:3000/api/movies' : '/api/movies';
            const catalogResponse = await fetch(moviesUrl);
            if (!catalogResponse.ok) throw new Error('Chưa tải được danh sách phim STARFLY.');
            const catalog = await catalogResponse.json();
            const normalize = value => String(value || '').normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            const request = normalize(userMessage);
            const movie = catalog.sort((first, second) => normalize(second.title).length - normalize(first.title).length)
                .find(entry => request.includes(normalize(entry.title)));
            const answer = movie
                ? `Mình đang mở bước đặt vé ${movie.title}. Chọn suất chiếu và ghế còn trống; sau khi bấm Đặt vé, trang vé sẽ hiện mã CASH… để đưa nhân viên khi thanh toán tiền mặt.`
                : 'Bạn muốn đặt phim nào? Hãy nhắn “Đặt vé” kèm đúng tên phim đang chiếu trên STARFLY nhé.';
            chat.messages.push({ role: 'assistant', content: answer });
            saveChats();
            if (movie) {
                window.setTimeout(() => {
                    window.location.href = `../index.html?bookMovie=${encodeURIComponent(movie.id)}`;
                }, 450);
            }
            return;
        }

        const configuredBase = typeof window.STARFLY_API_BASE_URL === 'string' ? window.STARFLY_API_BASE_URL.replace(/\/$/, '') : '';
        const apiUrl = configuredBase ? `${configuredBase}/api/chat` : window.location.protocol === 'file:' ? 'http://localhost:3000/api/chat' : '/api/chat';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chat.messages.slice(-24) })
        });
        const contentType = response.headers.get('content-type') || '';
        const rawBody = await response.text();
        let data = {};
        if (contentType.includes('application/json')) {
            try {
                data = rawBody ? JSON.parse(rawBody) : {};
            } catch {
                data = { error: 'Máy chủ trả về JSON không hợp lệ.' };
            }
        } else if (rawBody.trim()) {
            data = { error: rawBody.trim().slice(0, 500) };
        }
        if (!response.ok) throw new Error(data.error || `Máy chủ AI trả về lỗi HTTP ${response.status}.`);
        chat.messages.push({ role: 'assistant', content: data.reply });
        saveChats();
    } catch (error) {
        const isFilePreview = window.location.protocol === 'file:';
        const message = isFilePreview
            ? 'Mình chưa thể kết nối với máy chủ Starfly. Hãy khởi động backend rồi mở http://localhost:3000 (hoặc giữ trang file này khi backend chạy).'
            : `Mình chưa thể kết nối với bộ não AI lúc này. ${error.message}`;
        chat.messages.push({ role: 'assistant', content: message });
        saveChats();
    } finally {
        typing.remove();
        state.isGenerating = false;
        elements.sendBtn.disabled = false;
        renderMessages();
        updateVoiceStatus('Đang chờ câu nói tiếp theo');
        if (voiceRequest && state.voiceMode) {
            // Đọc đúng phần chữ đang hiển thị trong khung chat.
            const spokenText = normalizeAssistantText(chat.messages[chat.messages.length - 1].content);
            speakText(spokenText, true);
        }
    }
}

async function sendMessage(message, options = {}) {
    const text = message.trim();
    if (!text || state.isGenerating) return;
    if (!state.currentChatId) createNewChat();
    const chat = currentChat();
    if (chat.messages.length === 0) {
        chat.title = text.length > 32 ? `${text.slice(0, 32)}...` : text;
        renderHistory();
    }
    chat.messages.push({ role: 'user', content: text });
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    renderMessages();
    return respondTo(chat, text, options.voice === true);
}

function populateVoices() {
    if (!synth) return;
    voices = synth.getVoices();
    elements.ttsVoiceSelect.replaceChildren();
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        option.selected = voice.name === state.ttsVoice;
        elements.ttsVoiceSelect.appendChild(option);
    });
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const RECOGNITION_RESTART_DELAY = 400;
const MAX_EMPTY_LISTEN_ATTEMPTS = 3;

let recognition = null;
let recognitionRestartTimer = null;
let microphoneStream = null;
let isVoiceActive = false;
let lastVoiceTranscript = '';
let lastVoiceTranscriptAt = 0;
let emptyListenAttempts = 0;
let sessionSubmitted = false;
let lastRecognitionError = '';

function clearRecognitionRestart() {
    if (!recognitionRestartTimer) return;
    clearTimeout(recognitionRestartTimer);
    recognitionRestartTimer = null;
}

function stopRecognition() {
    clearRecognitionRestart();
    if (!recognition) return;
    try {
        recognition.stop();
    } catch {
        // Recognition đã dừng sẵn nên không cần xử lý.
    }
}

function startRecognition() {
    if (!recognition || !isVoiceActive || state.isSpeaking || state.isGenerating || state.isListening) return;
    try {
        recognition.start();
    } catch (error) {
        if (error.name !== 'InvalidStateError') updateVoiceStatus('Không thể bật microphone lúc này');
    }
}

// Chỉ bật lại microphone tối đa MAX_EMPTY_LISTEN_ATTEMPTS lần liên tiếp để không bị lặp vô hạn.
function scheduleRecognitionRestart() {
    if (recognitionRestartTimer) return;
    if (emptyListenAttempts >= MAX_EMPTY_LISTEN_ATTEMPTS) {
        stopVoiceInput();
        updateVoiceStatus('Starfly đã tạm dừng lắng nghe. Bấm "Nói chuyện" để tiếp tục.', true);
        return;
    }
    recognitionRestartTimer = setTimeout(() => {
        recognitionRestartTimer = null;
        if (isVoiceActive) startRecognition();
    }, RECOGNITION_RESTART_DELAY);
}

// Sau khi Starfly đọc xong: bật lại microphone nếu bật "Tự động lắng nghe", ngược lại kết thúc chế độ nói chuyện.
function resumeVoiceListening() {
    if (!isVoiceActive) return;
    if (!state.autoListen) {
        stopVoiceInput();
        updateVoiceStatus('Starfly đã trả lời xong. Bấm "Nói chuyện" để nói tiếp.', true);
        return;
    }
    startRecognition();
}

function stopMicrophoneStream() {
    if (!microphoneStream) return;
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
}

async function requestMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    if (microphoneStream) return true;
    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch {
        return false;
    }
}

function resetRecognitionSession() {
    emptyListenAttempts = 0;
    sessionSubmitted = false;
    lastRecognitionError = '';
}

function stopVoiceInput() {
    isVoiceActive = false;
    stopRecognition();
    stopMicrophoneStream();
    state.voiceMode = false;
    state.isListening = false;
    state.isSpeaking = false;
    resetRecognitionSession();
    if (synth) synth.cancel();
    document.querySelector('.hero-orbit')?.classList.remove('speaking');
    updateVoiceStatus();
}

async function startVoiceInput() {
    if (!state.voiceModeEnabled) {
        updateVoiceStatus('Chế độ nói chuyện đang tắt trong Cài đặt', true);
        return;
    }
    if (!recognition) {
        updateVoiceStatus('Trình duyệt này chưa hỗ trợ nhận diện giọng nói', true);
        return;
    }
    resetRecognitionSession();
    isVoiceActive = true;
    state.voiceMode = true;
    if (!(await requestMicrophone())) {
        stopVoiceInput();
        updateVoiceStatus('Bạn chưa cấp quyền microphone', true);
        return;
    }
    if (!isVoiceActive) return;
    updateVoiceStatus('Đang kết nối microphone');
    startRecognition();
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';
    recognition.onstart = () => {
        state.isListening = true;
        lastRecognitionError = '';
        updateVoiceStatus('Starfly đang lắng nghe');
    };
    recognition.onend = () => {
        state.isListening = false;
        if (!isVoiceActive) return;
        // Đang chờ câu trả lời hoặc đang đọc câu trả lời: microphone sẽ được bật lại sau khi Starfly nói xong.
        if (state.isSpeaking || state.isGenerating) return;
        if (sessionSubmitted) {
            sessionSubmitted = false;
            emptyListenAttempts = 0;
            return;
        }
        emptyListenAttempts += 1;
        updateVoiceStatus(lastRecognitionError === 'no-speech'
            ? 'Chưa nghe thấy tiếng nói, Starfly đang chờ'
            : 'Đang chờ câu nói tiếp theo');
        scheduleRecognitionRestart();
    };
    recognition.onresult = event => {
        const finalResult = Array.from(event.results).find(result => result.isFinal);
        const transcript = finalResult?.[0]?.transcript?.trim() || '';
        if (!finalResult || !transcript) return;
        const now = Date.now();
        if (transcript === lastVoiceTranscript && now - lastVoiceTranscriptAt < 2500) return;
        lastVoiceTranscript = transcript;
        lastVoiceTranscriptAt = now;
        sessionSubmitted = true;
        elements.userInput.value = transcript;
        elements.userInput.dispatchEvent(new Event('input'));
        stopRecognition();
        sendMessage(transcript, { voice: true });
    };
    recognition.onerror = event => {
        state.isListening = false;
        lastRecognitionError = event.error || '';
        if (lastRecognitionError === 'aborted') return;
        if (lastRecognitionError === 'not-allowed' || lastRecognitionError === 'service-not-allowed') {
            stopVoiceInput();
            updateVoiceStatus('Bạn chưa cấp quyền microphone', true);
            return;
        }
        if (lastRecognitionError === 'audio-capture') {
            stopVoiceInput();
            updateVoiceStatus('Không tìm thấy microphone trên thiết bị', true);
            return;
        }
        if (lastRecognitionError === 'no-speech') {
            updateVoiceStatus('Chưa nghe thấy tiếng nói, Starfly đang chờ');
        }
    };
} else {
    elements.sttBtn.title = 'Trình duyệt này chưa hỗ trợ nhận diện giọng nói';
}

/* Ô nhập tự cao lên theo nội dung nhưng không vượt quá chiều cao cho phép. */
function handleComposerInput() {
    elements.userInput.style.height = 'auto';
    elements.userInput.style.height = `${Math.min(elements.userInput.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
}

function handleComposerKeydown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    sendMessage(elements.userInput.value);
}

// Nút "Nói chuyện" duy nhất: bật microphone khi đang rảnh, tắt khi đang bật.
function handleVoiceButtonClick() {
    if (state.voiceMode) {
        stopVoiceInput();
        return;
    }
    startVoiceInput();
}

function clearConversation() {
    const chat = currentChat();
    if (!chat) return;
    chat.messages = [];
    chat.title = 'Cuộc trò chuyện mới';
    saveChats();
    renderHistory();
    renderMessages();
    closeSidebar();
}

function syncSettingsForm() {
    elements.ttsVoiceSelect.value = state.ttsVoice;
    elements.ttsSpeedInput.value = state.ttsSpeed;
    elements.ttsSpeedVal.textContent = `${state.ttsSpeed}x`;
    elements.ttsVolumeInput.value = state.voiceVolume;
    elements.ttsVolumeVal.textContent = `${Math.round(state.voiceVolume * 100)}%`;
    elements.voiceModeEnabled.checked = state.voiceModeEnabled;
    elements.autoListen.checked = state.autoListen;
}

function openSettingsModal() {
    syncSettingsForm();
    elements.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    elements.settingsModal.classList.add('hidden');
}

function isSettingsModalOpen() {
    return !elements.settingsModal.classList.contains('hidden');
}

function saveSettings() {
    state.ttsVoice = elements.ttsVoiceSelect.value;
    state.ttsSpeed = Number(elements.ttsSpeedInput.value);
    state.voiceVolume = Number(elements.ttsVolumeInput.value);
    state.voiceModeEnabled = elements.voiceModeEnabled.checked;
    state.autoListen = elements.autoListen.checked;
    localStorage.setItem('starfly_tts_voice', state.ttsVoice);
    localStorage.setItem('starfly_tts_speed', state.ttsSpeed);
    localStorage.setItem('starfly_tts_volume', state.voiceVolume);
    localStorage.setItem('starfly_voice_enabled', state.voiceModeEnabled);
    localStorage.setItem('starfly_auto_listen', state.autoListen);
    if (!state.voiceModeEnabled) stopVoiceInput();
    closeSettingsModal();
}

function resetAppearanceSettings() {
    state.theme = 'dark';
    state.interfaceBrightness = 100;
    state.backgroundBrightness = 100;
    applyAppearance();
    saveAppearance();
}

function bindEvents() {
    elements.chatForm.addEventListener('submit', event => {
        event.preventDefault();
        sendMessage(elements.userInput.value);
    });
    elements.userInput.addEventListener('input', handleComposerInput);
    elements.userInput.addEventListener('keydown', handleComposerKeydown);
    elements.sttBtn.addEventListener('click', handleVoiceButtonClick);
    elements.newChatBtn.addEventListener('click', createNewChat);
    elements.clearChatBtn.addEventListener('click', clearConversation);
    elements.mobileMenuBtn.addEventListener('click', () => elements.sidebar.classList.add('open'));
    elements.closeSidebarBtn.addEventListener('click', closeSidebar);
    document.querySelectorAll('.quick-prompt').forEach(button => {
        button.addEventListener('click', () => sendMessage(button.dataset.prompt));
    });
    elements.settingsToggleBtn.addEventListener('click', openSettingsModal);
    elements.closeModalBtn.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    // Bấm ra ngoài thẻ Cài đặt thì đóng cửa sổ.
    elements.settingsModal.addEventListener('click', event => {
        if (event.target === elements.settingsModal) closeSettingsModal();
    });
    // Phím Esc luôn đóng được Cài đặt để cửa sổ không bị kẹt trên màn hình.
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isSettingsModalOpen()) closeSettingsModal();
    });
    elements.ttsSpeedInput.addEventListener('input', event => {
        elements.ttsSpeedVal.textContent = `${event.target.value}x`;
    });
    elements.ttsVolumeInput.addEventListener('input', event => {
        elements.ttsVolumeVal.textContent = `${Math.round(Number(event.target.value) * 100)}%`;
    });
    elements.voiceModeEnabled.addEventListener('change', event => {
        if (!event.target.checked) stopVoiceInput();
    });
    elements.interfaceBrightness.addEventListener('input', event => {
        state.interfaceBrightness = Number(event.target.value);
        applyAppearance();
        saveAppearance();
    });
    elements.backgroundBrightness.addEventListener('input', event => {
        state.backgroundBrightness = Number(event.target.value);
        applyAppearance();
        saveAppearance();
    });
    elements.themeInputs.forEach(input => input.addEventListener('change', event => {
        state.theme = event.target.value;
        applyAppearance();
        saveAppearance();
    }));
    elements.resetAppearanceBtn.addEventListener('click', resetAppearanceSettings);
}

function init() {
    applyAppearance();
    populateVoices();
    if (synth && 'onvoiceschanged' in synth) synth.onvoiceschanged = populateVoices;
    if (state.chats.length) state.currentChatId = state.chats[0].id;
    syncSettingsForm();
    if (!recognition) elements.sttBtn.disabled = true;
    bindEvents();
    updateVoiceStatus();
    renderHistory();
    renderMessages();
}

init();
