
/* =========================================================
   DOUBLEF TEST MANAGEMENT
   PERMISSIONS
========================================================= */

(function () {

  "use strict";


  const roleLabels = {

    admin:
      "Quản trị viên",

    manager:
      "Quản lý dự án",

    tester:
      "Kiểm thử viên",

    viewer:
      "Người xem"

  };


  function label(
    role
  ) {

    return (
      roleLabels[role] ||
      "Người dùng"
    );

  }


  function isAdmin(
    profile
  ) {

    return (
      profile?.role ===
      "admin"
    );

  }


  function canCreateProject(
    profile
  ) {

    return [
      "admin",
      "manager"
    ].includes(
      profile?.role
    );

  }


  function canManagePlan(
    profile
  ) {

    return [
      "admin",
      "manager"
    ].includes(
      profile?.role
    );

  }


  function canCreateTestCase(
    profile
  ) {

    return [
      "admin",
      "manager",
      "tester"
    ].includes(
      profile?.role
    );

  }


  function canCreateDefect(
    profile
  ) {

    return [
      "admin",
      "manager",
      "tester"
    ].includes(
      profile?.role
    );

  }


  function canManageMembers(
    profile
  ) {

    return [
      "admin",
      "manager"
    ].includes(
      profile?.role
    );

  }


  window.Permissions = {

    label,

    isAdmin,

    canCreateProject,

    canManagePlan,

    canCreateTestCase,

    canCreateDefect,

    canManageMembers

  };

})();
