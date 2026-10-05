/* =========================================================
   DOUBLEF TEST MANAGEMENT
   SUPABASE CONFIG
   File: /kiem-thu/assets/js/config.js
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL =
  "https://aizhygivtngtsqcjtvaj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_T5kmdBx5e9EdE7WMxj3J4w_BWiJi8MN";


/* =========================================================
   2. KIỂM TRA CẤU HÌNH
========================================================= */

const isSupabaseConfigured =
  typeof SUPABASE_URL === "string" &&
  typeof SUPABASE_PUBLISHABLE_KEY === "string" &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_URL.includes(".supabase.co") &&
  SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");


/* =========================================================
   3. KHỞI TẠO SUPABASE CLIENT
========================================================= */

if (
  typeof supabase !== "undefined" &&
  isSupabaseConfigured
) {

  window.sb = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      db: {
        schema: "public"
      },

      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },

      global: {
        headers: {
          "X-Client-Info":
            "doublef-test-management"
        }
      }
    }
  );

  console.log(
    "DoubleF: Supabase connected successfully."
  );

} else {

  window.sb = null;

  console.error(
    "DoubleF: Supabase chưa được cấu hình hoặc thư viện Supabase chưa được tải."
  );

}


/* =========================================================
   4. APP CONFIG
========================================================= */

window.APP_CONFIG = {

  appName:
    "DoubleF Test Management",

  appShortName:
    "DF Test",

  version:
    "1.0.0",

  basePath:
    "/kiem-thu",

  paths: {

    login:
      "/kiem-thu/login",

    dashboard:
      "/kiem-thu/",

    project:
      "/kiem-thu/du-an",

    testCase:
      "/kiem-thu/test-case",

    testRun:
      "/kiem-thu/thuc-hien",

    defects:
      "/kiem-thu/loi",

    reports:
      "/kiem-thu/bao-cao",

    members:
      "/kiem-thu/thanh-vien"

  }

};


/* =========================================================
   5. HELPER
========================================================= */

window.getSupabaseClient = function () {

  if (!window.sb) {

    console.error(
      "Supabase client chưa được khởi tạo."
    );

    return null;
  }

  return window.sb;

};
