/* =========================================================
   DOUBLEF TEST MANAGEMENT
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://aizhygivtngtsqcjtvaj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_T5kmdBx5e9EdE7WMxj3J4w_BWiJi8MN";


/* =========================================================
   INIT SUPABASE
========================================================= */

if (typeof supabase === "undefined") {
  console.error("Supabase JS chưa được tải.");
  window.sb = null;
} else {

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
      }
    }
  );

  console.log(
    "DoubleF: Supabase connected successfully."
  );
}


/* =========================================================
   APP CONFIG
========================================================= */

window.APP_CONFIG = {

  appName:
    "DoubleF Test Management",

  version:
    "1.0.0",

  basePath:
    "/kiem-thu",

  paths: {

    login:
      "/kiem-thu/login",

    dashboard:
      "/kiem-thu/",

    projects:
      "/kiem-thu/du-an",

    plan:
      "/kiem-thu/ke-hoach",

    testCases:
      "/kiem-thu/test-case",

    defects:
      "/kiem-thu/loi",

    reports:
      "/kiem-thu/bao-cao",

    members:
      "/kiem-thu/thanh-vien"

  }

};
