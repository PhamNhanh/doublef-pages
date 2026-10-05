
/* =========================================================
   DOUBLEF TEST MANAGEMENT
   File: assets/js/auth.js
   Xử lý đăng nhập / đăng xuất / session
========================================================= */

(function () {
  "use strict";

  /* -------------------------------------------------------
     Helper
  ------------------------------------------------------- */

  function getCurrentPage() {
    const path = window.location.pathname.toLowerCase();

    if (path.endsWith("/login.html")) {
      return "login";
    }

    return "app";
  }

  function redirectToLogin() {
    window.location.href = "./login.html";
  }

  function redirectToDashboard() {
    window.location.href = "./index.html";
  }

  function showAuthMessage(message, type = "error") {
    const messageBox = document.getElementById("loginMessage");

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `login-message ${type}`;
    messageBox.style.display = "block";
  }

  function hideAuthMessage() {
    const messageBox = document.getElementById("loginMessage");

    if (!messageBox) return;

    messageBox.style.display = "none";
  }

  function setLoginLoading(loading) {
    const button = document.getElementById("btnLogin");
    const buttonText = document.getElementById("loginButtonText");
    const spinner = document.getElementById("loginSpinner");

    if (!button) return;

    button.disabled = loading;

    if (buttonText) {
      buttonText.textContent = loading
        ? "Đang đăng nhập..."
        : "Đăng nhập";
    }

    if (spinner) {
      spinner.style.display = loading ? "inline-block" : "none";
    }
  }

  /* -------------------------------------------------------
     Kiểm tra Supabase
  ------------------------------------------------------- */

  function checkSupabase() {
    if (!window.sb) {
      showAuthMessage(
        "Chưa cấu hình kết nối Supabase. Vui lòng kiểm tra file assets/js/config.js.",
        "error"
      );

      return false;
    }

    return true;
  }

  /* -------------------------------------------------------
     Đăng nhập
  ------------------------------------------------------- */

  async function login(email, password) {
    if (!checkSupabase()) {
      return {
        success: false
      };
    }

    try {
      setLoginLoading(true);
      hideAuthMessage();

      const { data, error } = await window.sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (!data || !data.user) {
        throw new Error("Không thể xác định tài khoản người dùng.");
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error("Login error:", error);

      let message = "Đăng nhập không thành công.";

      const errorMessage = String(error.message || "").toLowerCase();

      if (
        errorMessage.includes("invalid login credentials") ||
        errorMessage.includes("invalid credentials")
      ) {
        message = "Email hoặc mật khẩu không chính xác.";
      } else if (errorMessage.includes("email not confirmed")) {
        message = "Tài khoản chưa xác nhận địa chỉ email.";
      } else if (error.message) {
        message = error.message;
      }

      showAuthMessage(message, "error");

      return {
        success: false,
        error
      };
    } finally {
      setLoginLoading(false);
    }
  }

  /* -------------------------------------------------------
     Đăng xuất
  ------------------------------------------------------- */

  async function logout() {
    if (!window.sb) {
      redirectToLogin();
      return;
    }

    try {
      await window.sb.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      redirectToLogin();
    }
  }

  /* -------------------------------------------------------
     Lấy session hiện tại
  ------------------------------------------------------- */

  async function getSession() {
    if (!window.sb) return null;

    try {
      const {
        data: { session },
        error
      } = await window.sb.auth.getSession();

      if (error) {
        console.error(error);
        return null;
      }

      return session;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* -------------------------------------------------------
     Lấy User
  ------------------------------------------------------- */

  async function getCurrentUser() {
    if (!window.sb) return null;

    try {
      const {
        data: { user },
        error
      } = await window.sb.auth.getUser();

      if (error) {
        console.error(error);
        return null;
      }

      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* -------------------------------------------------------
     Bảo vệ trang
  ------------------------------------------------------- */

  async function guardPage() {
    const page = getCurrentPage();

    if (!window.sb) {
      if (page === "app") {
        console.warn("Chưa cấu hình Supabase.");
      }

      return;
    }

    const session = await getSession();

    if (page === "login") {
      if (session) {
        redirectToDashboard();
      }

      return;
    }

    if (!session) {
      redirectToLogin();
    }
  }

  /* -------------------------------------------------------
     Form Login
  ------------------------------------------------------- */

  function setupLoginForm() {
    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      hideAuthMessage();

      if (!email) {
        showAuthMessage("Vui lòng nhập địa chỉ email.");
        emailInput.focus();
        return;
      }

      if (!password) {
        showAuthMessage("Vui lòng nhập mật khẩu.");
        passwordInput.focus();
        return;
      }

      const result = await login(email, password);

      if (result.success) {
        showAuthMessage(
          "Đăng nhập thành công. Đang chuyển đến hệ thống...",
          "success"
        );

        setTimeout(() => {
          redirectToDashboard();
        }, 350);
      }
    });
  }

  /* -------------------------------------------------------
     Hiện/ẩn Password
  ------------------------------------------------------- */

  function setupPasswordToggle() {
    const button = document.getElementById("togglePassword");
    const password = document.getElementById("password");

    if (!button || !password) return;

    button.addEventListener("click", function () {
      const isPassword = password.type === "password";

      password.type = isPassword ? "text" : "password";

      button.innerHTML = isPassword
        ? `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-.6M9.9 4.2A9.8 9.8 0 0112 4c5 0 9 4 10 8a12.7 12.7 0 01-2.2 4.1M6.6 6.6A12.2 12.2 0 002 12c1 4 5 8 10 8a9.9 9.9 0 004.1-.9"/>
          </svg>
        `
        : `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        `;
    });
  }

  /* -------------------------------------------------------
     Theo dõi thay đổi authentication
  ------------------------------------------------------- */

  function setupAuthListener() {
    if (!window.sb) return;

    window.sb.auth.onAuthStateChange((event, session) => {
      const page = getCurrentPage();

      if (event === "SIGNED_OUT" && page !== "login") {
        redirectToLogin();
      }

      if (event === "SIGNED_IN" && page === "login" && session) {
        redirectToDashboard();
      }
    });
  }

  /* -------------------------------------------------------
     Khởi động
  ------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", async function () {
    setupLoginForm();
    setupPasswordToggle();
    setupAuthListener();

    await guardPage();
  });

  /* -------------------------------------------------------
     Public API
  ------------------------------------------------------- */

  window.Auth = {
    login,
    logout,
    getSession,
    getCurrentUser,
    guardPage
  };
})();
