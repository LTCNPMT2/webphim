(() => {
  const panel = document.getElementById("supportChatPanel");
  const list = document.getElementById("supportChatMessages");
  const form = document.getElementById("supportChatForm");
  const input = document.getElementById("supportChatInput");
  const send = document.getElementById("supportChatSend");
  if (!panel || !list || !form || !input || !send) return;

  const greeting = {
    role: "assistant",
    content: "Chào bạn! Mình có thể giúp gì về đặt vé, mã vé hoặc thanh toán?",
  };
  let messages;
  try {
    messages = JSON.parse(sessionStorage.getItem("starflyQuickSupport") || "null");
  } catch {
    messages = null;
  }
  if (!Array.isArray(messages) || !messages.length) messages = [greeting];

  function save() {
    sessionStorage.setItem("starflyQuickSupport", JSON.stringify(messages.slice(-20)));
  }

  function addMessage(role, content, temporary = false) {
    const bubble = document.createElement("div");
    bubble.className = `support-chat-bubble ${role === "user" ? "from-user" : "from-assistant"}`;
    bubble.textContent = content;
    if (temporary) bubble.dataset.typing = "true";
    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
    return bubble;
  }

  function render() {
    list.replaceChildren();
    messages.slice(-20).forEach((message) => addMessage(message.role, message.content));
  }

  function open() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    render();
    input.focus();
  }

  function close() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll('.nav-links a[href="/ai/"], .support-chat-launcher').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      open();
    });
  });
  document.getElementById("supportChatClose").addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("open")) close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content || send.disabled) return;

    messages.push({ role: "user", content });
    addMessage("user", content);
    input.value = "";
    send.disabled = true;
    const typing = addMessage("assistant", "Đang trả lời…", true);

    try {
      const normalizedRequest = content.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      if (/\b(dat ve|mua ve|book ticket)\b/.test(normalizedRequest)) {
        const movieTitle = window.STARFLY_BOOK_MOVIE_FROM_CHAT?.(content);
        const answer = movieTitle
          ? `Mình đã mở bước đặt vé ${movieTitle}. Bạn chọn một suất chiếu, chọn ghế còn trống rồi bấm “Đặt vé”. Đặt xong trang vé sẽ hiện mã CASH… để bạn đưa nhân viên khi trả tiền mặt.`
          : "Bạn muốn đặt phim nào? Hãy nhắn “Đặt vé” kèm đúng tên phim đang hiển thị trên STARFLY nhé.";
        typing.remove();
        messages.push({ role: "assistant", content: answer });
        addMessage("assistant", answer);
        save();
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-20) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Trợ lý đang bận, bạn thử lại sau nhé.");
      const answer = String(result.reply || "").trim() || "Mình chưa có câu trả lời cho câu này.";
      typing.remove();
      messages.push({ role: "assistant", content: answer });
      addMessage("assistant", answer);
      save();
    } catch (error) {
      typing.remove();
      const answer = error.message || "Chưa kết nối được trợ lý STARFLY.";
      messages.push({ role: "assistant", content: answer });
      addMessage("assistant", answer);
      save();
    } finally {
      send.disabled = false;
      input.focus();
    }
  });

  render();
})();
