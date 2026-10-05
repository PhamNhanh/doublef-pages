
/* =========================================================
   DOUBLEF TEST MANAGEMENT
   DATABASE HELPERS
========================================================= */

(function () {

  "use strict";


  function client() {

    if (!window.sb) {

      throw new Error(
        "Supabase chưa được khởi tạo."
      );

    }

    return window.sb;

  }


  /* =======================================================
     PROFILE
  ======================================================= */

  async function getProfile(
    userId
  ) {

    const {
      data,
      error
    } =
      await client()
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();


    if (error) {
      throw error;
    }


    return data;

  }


  async function getProfiles() {

    const {
      data,
      error
    } =
      await client()
        .from("profiles")
        .select("*")
        .order(
          "full_name",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  /* =======================================================
     PROJECTS
  ======================================================= */

  async function getProjects() {

    const {
      data,
      error
    } =
      await client()
        .from("projects")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function createProject(
    payload
  ) {

    const {
      data,
      error
    } =
      await client()
        .from("projects")
        .insert(payload)
        .select()
        .single();


    if (error) {
      throw error;
    }


    return data;

  }


  /* =======================================================
     MEMBERS
  ======================================================= */

  async function getProjectMembers() {

    const {
      data,
      error
    } =
      await client()
        .from("project_members")
        .select("*")
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function upsertProjectMember(
    payload
  ) {

    const {
      data,
      error
    } =
      await client()
        .from("project_members")
        .upsert(
          payload,
          {
            onConflict:
              "project_id,user_id"
          }
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    return data;

  }


  /* =======================================================
     MODULES
  ======================================================= */

  async function getModules() {

    const {
      data,
      error
    } =
      await client()
        .from("test_modules")
        .select("*")
        .order(
          "sort_order",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function createModule(
    payload
  ) {

    const {
      data,
      error
    } =
      await client()
        .from("test_modules")
        .insert(payload)
        .select()
        .single();


    if (error) {
      throw error;
    }


    return data;

  }


  /* =======================================================
     TEST CASES
  ======================================================= */

  async function getTestCases() {

    const {
      data,
      error
    } =
      await client()
        .from("test_cases")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function createTestCase(
    payload
  ) {

    const {
      data,
      error
    } =
      await client()
        .from("test_cases")
        .insert(payload)
        .select()
        .single();


    if (error) {
      throw error;
    }


    return data;

  }


  /* =======================================================
     TEST RUNS
  ======================================================= */

  async function getTestRuns() {

    const {
      data,
      error
    } =
      await client()
        .from("test_runs")
        .select("*")
        .order(
          "tested_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  /* =======================================================
     DEFECTS
  ======================================================= */

  async function getDefects() {

    const {
      data,
      error
    } =
      await client()
        .from("defects")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function createDefect(
    payload
  ) {

    const {
      data,
      error
    } =
      await client()
        .from("defects")
        .insert(payload)
        .select()
        .single();


    if (error) {
      throw error;
    }


    return data;

  }


  /* =======================================================
     PUBLIC
  ======================================================= */

  window.DB = {

    getProfile,

    getProfiles,

    getProjects,

    createProject,

    getProjectMembers,

    upsertProjectMember,

    getModules,

    createModule,

    getTestCases,

    createTestCase,

    getTestRuns,

    getDefects,

    createDefect

  };

})();
