
/* =========================================================
   DOUBLEF TEST MANAGEMENT
   File: assets/js/config.js
   Cấu hình kết nối Supabase
========================================================= */

/*
  THAY 2 GIÁ TRỊ BÊN DƯỚI BẰNG THÔNG TIN SUPABASE CỦA BẠN.

  Vào:
  Supabase
  -> Project Settings
  -> API

  Project URL     => SUPABASE_URL
  anon public key => SUPABASE_ANON_KEY

  TUYỆT ĐỐI KHÔNG dùng service_role key ở frontend.
*/

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";

const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

/* ---------------------------------------------------------
   Kiểm tra cấu hình
--------------------------------------------------------- */

const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

/* ---------------------------------------------------------
   Khởi tạo Supabase Client
--------------------------------------------------------- */

if (typeof supabase !== "undefined" && isSupabaseConfigured) {
  window.sb = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  console.log("Supabase đã được khởi tạo.");
} else {
  window.sb = null;

  if (!isSupabaseConfigured) {
    console.warn(
      "Chưa cấu hình Supabase. Hãy cập nhật SUPABASE_URL và SUPABASE_ANON_KEY trong config.js"
    );
  }
}

/* ---------------------------------------------------------
   Cấu hình chung ứng dụng
--------------------------------------------------------- */

window.APP_CONFIG = {
  appName: "DoubleF Test Management",
  appShortName: "DF Test",
  version: "1.0.0",

  paths: {
    dashboard: "./index.html",
    login: "./login.html"
  }
};
