/* =========================================================
   DOUBLEF TEST MANAGEMENT
   AUTHENTICATION
========================================================= */

(function () {

  "use strict";


  /* =======================================================
     PATH
  ======================================================= */

  function currentPath() {

    return window.location.pathname
      .toLowerCase()
      .replace(/\/+$/, "");

  }


  function isLoginPage() {

    const path = currentPath();

    return (
      path.endsWith("/kiem-thu/login") ||
      path.endsWith("/kiem-thu/login.html")
    );

  }


  function goLogin() {

    window.location.replace(
      window.APP_CONFIG?.paths?.login ||
      "/kiem-thu/login"
    );

  }


  function goDashboard() {

    window.location.replace(
      window.APP_CONFIG?.paths?.dashboard ||
      "/kiem-thu/"
    );

  }


  /* =======================================================
     MESSAGE
  ======================================================= */

  function showLoginMessage(
    message,
    type = "error"
  ) {

    const el =
      document.getElementById(
        "loginMessage"
      );

    if (!el) return;

    el.textContent = message;

    el.className =
      "login-message " + type;

    el.hidden = false;

  }


  function hideLoginMessage() {

    const el =
      document.getElementById(
        "loginMessage"
      );

    if (!el) return;

    el.hidden = true;

  }


  /* =======================================================
     LOADING
  ======================================================= */

  function setLoginLoading(
    loading
  ) {

    const btn =
      document.getElementById(
        "btnLogin"
      );

    const label =
      document.getElementById(
        "loginButtonText"
      );

    const spinner =
      document.getElementById(
        "loginSpinner"
      );


    if (btn) {
      btn.disabled = loading;
    }


    if (label) {

      label.textContent =
        loading
          ? "Đang đăng nhập..."
          : "Đăng nhập";

    }


    if (spinner) {

      spinner.hidden =
        !loading;

    }

  }


  /* =======================================================
     SESSION
  ======================================================= */

  async function getSession() {

    if (!window.sb) {
      return null;
    }

    const {
      data,
      error
    } =
      await window.sb.auth
        .getSession();


    if (error) {

      console.error(
        "getSession:",
        error
      );

      return null;

    }


    return data.session;

  }


  async function getCurrentUser() {

    if (!window.sb) {
      return null;
    }


    const {
      data,
      error
    } =
      await window.sb.auth
        .getUser();


    if (error) {

      console.error(
        "getCurrentUser:",
        error
      );

      return null;

    }


    return data.user;

  }


  /* =======================================================
     LOGIN
  ======================================================= */

  async function login(
    email,
    password
  ) {

    if (!window.sb) {

      showLoginMessage(
        "Không kết nối được Supabase."
      );

      return false;

    }


    setLoginLoading(true);

    hideLoginMessage();


    try {

      const {
        data,
        error
      } =
        await window.sb.auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {

        console.error(
          error
        );


        const text =
          String(
            error.message || ""
          ).toLowerCase();


        if (
          text.includes(
            "invalid login credentials"
          )
        ) {

          showLoginMessage(
            "Email hoặc mật khẩu không chính xác."
          );

        }

        else if (
          text.includes(
            "email not confirmed"
          )
        ) {

          showLoginMessage(
            "Tài khoản chưa được xác nhận email."
          );

        }

        else {

          showLoginMessage(
            error.message ||
            "Không thể đăng nhập."
          );

        }


        return false;

      }


      if (
        !data?.session ||
        !data?.user
      ) {

        showLoginMessage(
          "Không nhận được phiên đăng nhập."
        );

        return false;

      }


      showLoginMessage(
        "Đăng nhập thành công.",
        "success"
      );


      setTimeout(
        goDashboard,
        250
      );


      return true;

    }

    catch (error) {

      console.error(
        error
      );

      showLoginMessage(
        "Có lỗi khi kết nối máy chủ."
      );

      return false;

    }

    finally {

      setLoginLoading(false);

    }

  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {

    try {

      if (window.sb) {

        await window.sb.auth
          .signOut();

      }

    }

    finally {

      goLogin();

    }

  }


  /* =======================================================
     LOGIN FORM
  ======================================================= */

  function bindLoginForm() {

    const form =
      document.getElementById(
        "loginForm"
      );

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        event.stopPropagation();


        const email =
          document
            .getElementById("email")
            ?.value
            .trim();


        const password =
          document
            .getElementById("password")
            ?.value;


        if (!email) {

          showLoginMessage(
            "Vui lòng nhập email."
          );

          return;

        }


        if (!password) {

          showLoginMessage(
            "Vui lòng nhập mật khẩu."
          );

          return;

        }


        await login(
          email,
          password
        );

      }
    );

  }


  /* =======================================================
     PASSWORD TOGGLE
  ======================================================= */

  function bindPasswordToggle() {

    const button =
      document.getElementById(
        "togglePassword"
      );

    const input =
      document.getElementById(
        "password"
      );


    if (
      !button ||
      !input
    ) return;


    button.addEventListener(
      "click",
      function () {

        input.type =
          input.type === "password"
            ? "text"
            : "password";

      }
    );

  }


  /* =======================================================
     REQUIRE LOGIN
  ======================================================= */

  async function requireAuth() {

    const session =
      await getSession();


    if (!session) {

      goLogin();

      return null;

    }


    return session;

  }


  /* =======================================================
     INIT
  ======================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    async function () {

      if (!window.sb) {

        console.error(
          "Supabase client chưa sẵn sàng."
        );

        return;

      }


      if (isLoginPage()) {

        bindLoginForm();

        bindPasswordToggle();


        const session =
          await getSession();


        if (session) {
          goDashboard();
        }

      }

    }
  );


  /* =======================================================
     PUBLIC
  ======================================================= */

  window.Auth = {

    login,

    logout,

    getSession,

    getCurrentUser,

    requireAuth,

    goLogin,

    goDashboard

  };

})();
