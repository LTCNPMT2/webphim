const $ = (id) => document.getElementById(id);

function readCustomer() {
  try {
    return JSON.parse(localStorage.getItem("starflyCustomer") || "null");
  } catch {
    return null;
  }
}

function showSession(customer) {
  localStorage.setItem("starflyCustomerId", customer.id);
  localStorage.setItem("starflyCustomer", JSON.stringify(customer));
  $("guestPanel").classList.add("hidden");
  $("accountPanel").classList.remove("hidden");
  $("memberName").textContent = customer.full_name || "STARFLY Member";
  $("memberEmail").textContent = customer.email || "";
}

function showMessage(text, error = false) {
  $("message").textContent = text;
  $("message").classList.toggle("error", error);
}

function setMode(mode) {
  const login = mode === "login";
  $("loginForm").classList.toggle("hidden", !login);
  $("registerForm").classList.toggle("hidden", login);
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  showMessage("");
}

async function requestAccount(url, form) {
  const data = Object.fromEntries(new FormData(form).entries());
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("Không kết nối được STARFLY. Hãy chạy npm start rồi mở http://localhost:3000/pages/auth.html.");
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Bạn đang mở server cũ hoặc Live Server. Hãy mở trang STARFLY tại http://localhost:3000/pages/auth.html.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Không thể kết nối STARFLY.");
  showSession(result);
  const params = new URLSearchParams(window.location.search);
  if (params.get("continue") === "booking" && params.get("movieId")) {
    window.location.href = `/?bookMovie=${encodeURIComponent(params.get("movieId"))}`;
  }
  showMessage(url.endsWith("login") ? "Đăng nhập thành công." : "Tạo tài khoản thành công.");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await requestAccount("/api/auth/login", event.currentTarget);
  } catch (error) {
    showMessage(error.message, true);
  }
});

$("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await requestAccount("/api/auth/register", event.currentTarget);
  } catch (error) {
    showMessage(error.message, true);
  }
});

$("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("starflyCustomerId");
  localStorage.removeItem("starflyCustomer");
  $("accountPanel").classList.add("hidden");
  $("guestPanel").classList.remove("hidden");
  setMode("login");
});

const customer = readCustomer();
if (customer?.id) showSession(customer);
