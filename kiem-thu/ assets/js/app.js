
/* =========================================================
   DOUBLEF TEST MANAGEMENT
   File: assets/js/app.js
========================================================= */

(function () {
  "use strict";

  const state = {
    user: null,
    profile: null
  };

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */

  function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getInitials(name) {
    if (!name) return "U";

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return "U";

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[parts.length - 2][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  function formatRole(role) {
    const roles = {
      admin: "Quản trị viên",
      manager: "Quản lý dự án",
      tester: "Kiểm thử viên",
      viewer: "Người xem"
    };

    return roles[role] || "Người dùng";
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  /* -------------------------------------------------------
     Sidebar
  ------------------------------------------------------- */

  function setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const btnMenu = document.getElementById("btnMenu");
    const btnClose = document.getElementById("btnCloseSidebar");

    function openSidebar() {
      sidebar?.classList.add("open");
      overlay?.classList.add("show");
      document.body.classList.add("sidebar-open");
    }

    function closeSidebar() {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("show");
      document.body.classList.remove("sidebar-open");
    }

    btnMenu?.addEventListener("click", openSidebar);
    btnClose?.addEventListener("click", closeSidebar);
    overlay?.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) {
        closeSidebar();
      }
    });
  }

  /* -------------------------------------------------------
     User dropdown
  ------------------------------------------------------- */

  function setupUserMenu() {
    const button = document.getElementById("btnUserMenu");
    const dropdown = document.getElementById("userDropdown");

    if (!button || !dropdown) return;

    button.addEventListener("click", function (event) {
      event.stopPropagation();

      dropdown.classList.toggle("show");
    });

    document.addEventListener("click", function () {
      dropdown.classList.remove("show");
    });

    dropdown.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  /* -------------------------------------------------------
     Logout
  ------------------------------------------------------- */

  function setupLogout() {
    const buttons = document.querySelectorAll("[data-action='logout']");

    buttons.forEach((button) => {
      button.addEventListener("click", async function () {
        button.disabled = true;

        if (window.Auth) {
          await window.Auth.logout();
        }
      });
    });
  }

  /* -------------------------------------------------------
     Load Profile từ bảng profiles
  ------------------------------------------------------- */

  async function loadProfile(user) {
    if (!window.sb || !user) {
      return null;
    }

    try {
      const { data, error } = await window.sb
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          role,
          department,
          active
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn(
          "Không thể đọc bảng profiles. Hệ thống sẽ dùng dữ liệu từ Auth.",
          error.message
        );

        return null;
      }

      return data;
    } catch (error) {
      console.warn("Profile error:", error);

      return null;
    }
  }

  /* -------------------------------------------------------
     Render User
  ------------------------------------------------------- */

  function renderUser(user, profile) {
    if (!user) return;

    const metadata = user.user_metadata || {};

    const name =
      profile?.full_name ||
      metadata.full_name ||
      metadata.name ||
      user.email ||
      "Người dùng";

    const email =
      profile?.email ||
      user.email ||
      "";

    const role =
      profile?.role ||
      metadata.role ||
      "viewer";

    const department =
      profile?.department ||
      metadata.department ||
      "";

    const initials = getInitials(name);

    document.querySelectorAll("[data-user-name]").forEach((element) => {
      element.textContent = name;
    });

    document.querySelectorAll("[data-user-email]").forEach((element) => {
      element.textContent = email;
    });

    document.querySelectorAll("[data-user-role]").forEach((element) => {
      element.textContent = formatRole(role);
    });

    document
      .querySelectorAll("[data-user-department]")
      .forEach((element) => {
        element.textContent = department || "Chưa cập nhật đơn vị";
      });

    document.querySelectorAll("[data-user-avatar]").forEach((element) => {
      element.textContent = initials;
    });

    const welcome = document.getElementById("welcomeUser");

    if (welcome) {
      const shortName = name.split(/\s+/).slice(-2).join(" ");

      welcome.textContent = shortName;
    }
  }

  /* -------------------------------------------------------
     Date
  ------------------------------------------------------- */

  function renderDate() {
    const element = document.getElementById("currentDate");

    if (!element) return;

    element.textContent = formatDate(new Date());
  }

  /* -------------------------------------------------------
     Demo Dashboard

     Sau này phần này sẽ lấy dữ liệu từ:
       projects
       test_cases
       test_runs
       defects
  ------------------------------------------------------- */

  async function loadDashboardStatistics() {
    if (!window.sb) {
      renderStatistics({
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0
      });

      return;
    }

    try {
      /*
        Khi đã tạo bảng test_cases/test_runs,
        chúng ta sẽ thay phần này bằng truy vấn thật.

        Hiện tại code giữ ở mức an toàn để dashboard
        không lỗi khi database chưa tạo.
      */

      renderStatistics({
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0
      });
    } catch (error) {
      console.error(error);
    }
  }

  function renderStatistics(stats) {
    const values = {
      totalTests: stats.total || 0,
      passedTests: stats.passed || 0,
      failedTests: stats.failed || 0,
      blockedTests: stats.blocked || 0
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = new Intl.NumberFormat("vi-VN").format(value);
      }
    });

    const total = Number(stats.total || 0);
    const passed = Number(stats.passed || 0);

    const progress =
      total > 0
        ? Math.round((passed / total) * 100)
        : 0;

    const progressText =
      document.getElementById("testingProgressText");

    const progressBar =
      document.getElementById("testingProgressBar");

    if (progressText) {
      progressText.textContent = `${progress}%`;
    }

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  /* -------------------------------------------------------
     Load user
  ------------------------------------------------------- */

  async function initializeUser() {
    if (!window.Auth) {
      return;
    }

    const user = await window.Auth.getCurrentUser();

    if (!user) {
      return;
    }

    state.user = user;

    const profile = await loadProfile(user);

    state.profile = profile;

    renderUser(user, profile);
  }

  /* -------------------------------------------------------
     Active navigation
  ------------------------------------------------------- */

  function setupNavigation() {
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.addEventListener("click", function (event) {
        const href = link.getAttribute("href");

        if (!href || href === "#") {
          event.preventDefault();
        }
      });
    });
  }

  /* -------------------------------------------------------
     Initialization
  ------------------------------------------------------- */

  async function init() {
    setupSidebar();
    setupUserMenu();
    setupLogout();
    setupNavigation();

    renderDate();

    await initializeUser();
    await loadDashboardStatistics();

    document.body.classList.add("app-loaded");
  }

  document.addEventListener("DOMContentLoaded", init);

  window.TestApp = {
    state,
    renderStatistics
  };
})();
