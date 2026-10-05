/* =========================================================
   DOUBLEF TEST MANAGEMENT
   MAIN APPLICATION
========================================================= */

(function () {

  "use strict";


  const state = {

    user:
      null,

    profile:
      null,

    projects:
      [],

    modules:
      [],

    testCases:
      [],

    testRuns:
      [],

    defects:
      [],

    profiles:
      [],

    members:
      []

  };


  /* =======================================================
     UTILS
  ======================================================= */

  function esc(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  function fmtDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return esc(value);

    }


    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric"
      }
    ).format(date);

  }


  function initials(
    name
  ) {

    const parts =
      String(
        name || "User"
      )
        .trim()
        .split(/\s+/);


    if (
      parts.length === 1
    ) {

      return parts[0]
        .slice(0, 2)
        .toUpperCase();

    }


    return (
      parts[
        parts.length - 2
      ][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase();

  }


  function toast(
    message,
    type = "success"
  ) {

    let el =
      document.getElementById(
        "appToast"
      );


    if (!el) {

      el =
        document.createElement(
          "div"
        );

      el.id =
        "appToast";

      document.body
        .appendChild(el);

    }


    el.textContent =
      message;

    el.className =
      "toast " + type;


    requestAnimationFrame(
      function () {

        el.classList
          .add("show");

      }
    );


    setTimeout(
      function () {

        el.classList
          .remove("show");

      },
      2800
    );

  }


  function loadingHTML() {

    return `
      <div class="loading-box">
        <div class="loader"></div>
        <span>Đang tải dữ liệu...</span>
      </div>
    `;

  }


  function emptyHTML(
    text
  ) {

    return `
      <div class="empty-state">
        ${esc(text)}
      </div>
    `;

  }


  /* =======================================================
     DATA
  ======================================================= */

  async function loadBaseData() {

    state.projects =
      await DB.getProjects();

    state.modules =
      await DB.getModules();

    state.testCases =
      await DB.getTestCases();

    state.testRuns =
      await DB.getTestRuns();

    state.defects =
      await DB.getDefects();

  }


  /* =======================================================
     SHELL
  ======================================================= */

  function navItem(
    href,
    label,
    page,
    current
  ) {

    const active =
      page === current
        ? "active"
        : "";


    return `
      <a
        class="nav-link ${active}"
        href="${href}"
      >
        <span>${label}</span>
      </a>
    `;

  }


  function renderShell(
    page
  ) {

    const root =
      document.getElementById(
        "app"
      );

    if (!root) return;


    const name =
      state.profile?.full_name ||
      state.user?.email ||
      "Người dùng";


    const role =
      Permissions.label(
        state.profile?.role
      );


    root.innerHTML = `

      <div class="app-layout">

        <div
          id="sidebarOverlay"
          class="sidebar-overlay"
        ></div>

        <aside
          id="sidebar"
          class="sidebar"
        >

          <div class="brand">

            <div class="brand-mark">
              DF
            </div>

            <div>
              <strong>
                DoubleF Test
              </strong>

              <small>
                Test Management
              </small>
            </div>

          </div>


          <nav class="nav-menu">

            ${navItem(
              "/kiem-thu/",
              "Tổng quan",
              "dashboard",
              page
            )}

            ${navItem(
              "/kiem-thu/du-an",
              "Dự án",
              "projects",
              page
            )}

            ${navItem(
              "/kiem-thu/ke-hoach",
              "Kế hoạch kiểm thử",
              "plan",
              page
            )}

            ${navItem(
              "/kiem-thu/test-case",
              "Test Case",
              "testcases",
              page
            )}

            ${navItem(
              "/kiem-thu/loi",
              "Quản lý lỗi",
              "defects",
              page
            )}

            ${navItem(
              "/kiem-thu/bao-cao",
              "Báo cáo",
              "reports",
              page
            )}

            ${navItem(
              "/kiem-thu/thanh-vien",
              "Thành viên",
              "members",
              page
            )}

          </nav>


          <div class="sidebar-user">

            <div class="user-avatar">
              ${esc(
                initials(name)
              )}
            </div>

            <div class="sidebar-user-info">

              <strong>
                ${esc(name)}
              </strong>

              <small>
                ${esc(role)}
              </small>

            </div>

          </div>

        </aside>


        <div class="main">

          <header class="topbar">

            <div class="topbar-left">

              <button
                id="btnMenu"
                class="icon-button mobile-only"
                type="button"
              >
                ☰
              </button>

              <div>

                <strong
                  id="topbarTitle"
                >
                  DoubleF Test Management
                </strong>

                <small>
                  Quản lý kiểm thử dự án
                </small>

              </div>

            </div>


            <div class="topbar-right">

              <div class="topbar-user">

                <span>
                  ${esc(name)}
                </span>

                <small>
                  ${esc(role)}
                </small>

              </div>

              <button
                id="btnLogout"
                class="button secondary"
                type="button"
              >
                Đăng xuất
              </button>

            </div>

          </header>


          <main
            id="pageContent"
            class="page-content"
          >

            ${loadingHTML()}

          </main>

        </div>

      </div>

    `;


    bindShell();

  }


  function bindShell() {

    document
      .getElementById(
        "btnLogout"
      )
      ?.addEventListener(
        "click",
        function () {

          Auth.logout();

        }
      );


    const sidebar =
      document.getElementById(
        "sidebar"
      );

    const overlay =
      document.getElementById(
        "sidebarOverlay"
      );


    function close() {

      sidebar?.classList
        .remove("open");

      overlay?.classList
        .remove("show");

    }


    document
      .getElementById(
        "btnMenu"
      )
      ?.addEventListener(
        "click",
        function () {

          sidebar?.classList
            .add("open");

          overlay?.classList
            .add("show");

        }
      );


    overlay
      ?.addEventListener(
        "click",
        close
      );

  }


  /* =======================================================
     DASHBOARD
  ======================================================= */

  function latestRunMap() {

    const map =
      new Map();


    for (
      const run
      of state.testRuns
    ) {

      if (
        !map.has(
          run.test_case_id
        )
      ) {

        map.set(
          run.test_case_id,
          run
        );

      }

    }


    return map;

  }


  function renderDashboard() {

    const latest =
      latestRunMap();


    let pass = 0;
    let fail = 0;
    let blocked = 0;


    for (
      const tc
      of state.testCases
    ) {

      const run =
        latest.get(tc.id);


      if (!run) continue;


      if (
        run.result === "PASS"
      ) pass++;


      if (
        run.result === "FAIL"
      ) fail++;


      if (
        run.result === "BLOCKED"
      ) blocked++;

    }


    const total =
      state.testCases.length;


    const executed =
      pass +
      fail +
      blocked;


    const progress =
      total
        ? Math.round(
            executed /
            total *
            100
          )
        : 0;


    const openDefects =
      state.defects
        .filter(
          item =>
            ![
              "closed",
              "rejected"
            ].includes(
              item.status
            )
        ).length;


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>
          <h1>
            Tổng quan kiểm thử
          </h1>

          <p>
            Theo dõi tình trạng kiểm thử
            trên các dự án bạn được phân quyền.
          </p>
        </div>

      </div>


      <div class="stats-grid">

        <div class="stat-card">

          <span class="stat-label">
            Tổng Test Case
          </span>

          <strong class="stat-value">
            ${total}
          </strong>

          <small>
            Toàn bộ kịch bản
          </small>

        </div>


        <div class="stat-card success">

          <span class="stat-label">
            Pass
          </span>

          <strong class="stat-value">
            ${pass}
          </strong>

          <small>
            Đạt yêu cầu
          </small>

        </div>


        <div class="stat-card danger">

          <span class="stat-label">
            Fail
          </span>

          <strong class="stat-value">
            ${fail}
          </strong>

          <small>
            Không đạt
          </small>

        </div>


        <div class="stat-card warning">

          <span class="stat-label">
            Blocked
          </span>

          <strong class="stat-value">
            ${blocked}
          </strong>

          <small>
            Bị chặn
          </small>

        </div>


        <div class="stat-card purple">

          <span class="stat-label">
            Lỗi đang mở
          </span>

          <strong class="stat-value">
            ${openDefects}
          </strong>

          <small>
            Cần xử lý
          </small>

        </div>

      </div>


      <div class="grid-2">

        <section class="card">

          <div class="card-header">

            <div>

              <h2>
                Tiến độ kiểm thử
              </h2>

              <p>
                Tỷ lệ Test Case đã thực hiện
              </p>

            </div>

            <strong
              class="progress-number"
            >
              ${progress}%
            </strong>

          </div>


          <div class="card-body">

            <div class="progress-track">

              <div
                class="progress-fill"
                style="width:${progress}%"
              ></div>

            </div>

            <div class="summary-row">

              <span>
                Đã thực hiện
              </span>

              <strong>
                ${executed}/${total}
              </strong>

            </div>

          </div>

        </section>


        <section class="card">

          <div class="card-header">

            <div>

              <h2>
                Dự án
              </h2>

              <p>
                Dự án có quyền truy cập
              </p>

            </div>

            <strong>
              ${state.projects.length}
            </strong>

          </div>


          <div class="card-body compact">

            ${
              state.projects.length
                ? state.projects
                    .slice(0, 5)
                    .map(
                      p => `
                        <div class="list-row">

                          <div>

                            <strong>
                              ${esc(
                                p.project_name
                              )}
                            </strong>

                            <small>
                              ${esc(
                                p.project_code
                              )}
                            </small>

                          </div>

                          <span
                            class="badge ${esc(
                              p.status
                            )}"
                          >
                            ${esc(
                              p.status
                            )}
                          </span>

                        </div>
                      `
                    )
                    .join("")
                : emptyHTML(
                    "Chưa có dự án."
                  )
            }

          </div>

        </section>

      </div>

    `;

  }


  /* =======================================================
     PROJECTS
  ======================================================= */

  function renderProjects() {

    const canCreate =
      Permissions
        .canCreateProject(
          state.profile
        );


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>

          <h1>
            Quản lý dự án
          </h1>

          <p>
            Danh sách các dự án kiểm thử.
          </p>

        </div>

        ${
          canCreate
            ? `
              <button
                class="button primary"
                data-toggle="projectForm"
              >
                + Tạo dự án
              </button>
            `
            : ""
        }

      </div>


      ${
        canCreate
          ? `
            <section
              id="projectForm"
              class="card form-panel hidden"
            >

              <div class="card-header">

                <h2>
                  Tạo dự án mới
                </h2>

              </div>

              <form
                id="createProjectForm"
                class="form-grid"
              >

                <label>

                  <span>
                    Mã dự án
                  </span>

                  <input
                    name="project_code"
                    required
                  >

                </label>


                <label>

                  <span>
                    Tên dự án
                  </span>

                  <input
                    name="project_name"
                    required
                  >

                </label>


                <label>

                  <span>
                    Đơn vị sử dụng
                  </span>

                  <input
                    name="client_name"
                  >

                </label>


                <label>

                  <span>
                    Trạng thái
                  </span>

                  <select
                    name="status"
                  >
                    <option value="planning">
                      Planning
                    </option>

                    <option value="active">
                      Active
                    </option>
                  </select>

                </label>


                <label>

                  <span>
                    Ngày bắt đầu
                  </span>

                  <input
                    type="date"
                    name="start_date"
                  >

                </label>


                <label>

                  <span>
                    Ngày kết thúc
                  </span>

                  <input
                    type="date"
                    name="end_date"
                  >

                </label>


                <label class="full">

                  <span>
                    Mô tả
                  </span>

                  <textarea
                    name="description"
                    rows="4"
                  ></textarea>

                </label>


                <div class="full">

                  <button
                    class="button primary"
                    type="submit"
                  >
                    Lưu dự án
                  </button>

                </div>

              </form>

            </section>
          `
          : ""
      }


      <section class="card">

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Mã
                </th>

                <th>
                  Tên dự án
                </th>

                <th>
                  Đơn vị
                </th>

                <th>
                  Thời gian
                </th>

                <th>
                  Trạng thái
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                state.projects.length
                  ? state.projects
                      .map(
                        item => `
                          <tr>

                            <td>
                              <strong>
                                ${esc(
                                  item.project_code
                                )}
                              </strong>
                            </td>

                            <td>
                              ${esc(
                                item.project_name
                              )}
                            </td>

                            <td>
                              ${esc(
                                item.client_name ||
                                "—"
                              )}
                            </td>

                            <td>
                              ${fmtDate(
                                item.start_date
                              )}
                              -
                              ${fmtDate(
                                item.end_date
                              )}
                            </td>

                            <td>

                              <span
                                class="badge ${esc(
                                  item.status
                                )}"
                              >
                                ${esc(
                                  item.status
                                )}
                              </span>

                            </td>

                          </tr>
                        `
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="5"
                      >
                        ${emptyHTML(
                          "Chưa có dự án."
                        )}
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </section>

    `;


    bindFormToggles();

    bindProjectForm();

  }


  async function bindProjectForm() {

    const form =
      document.getElementById(
        "createProjectForm"
      );

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        const formData =
          new FormData(form);


        try {

          await DB.createProject({

            project_code:
              formData
                .get(
                  "project_code"
                )
                .trim(),

            project_name:
              formData
                .get(
                  "project_name"
                )
                .trim(),

            client_name:
              formData
                .get(
                  "client_name"
                )
                .trim() || null,

            status:
              formData
                .get(
                  "status"
                ),

            start_date:
              formData
                .get(
                  "start_date"
                ) || null,

            end_date:
              formData
                .get(
                  "end_date"
                ) || null,

            description:
              formData
                .get(
                  "description"
                )
                .trim() || null,

            created_by:
              state.user.id

          });


          toast(
            "Đã tạo dự án."
          );


          state.projects =
            await DB.getProjects();


          renderProjects();

        }

        catch (error) {

          console.error(
            error
          );

          toast(
            error.message,
            "error"
          );

        }

      }
    );

  }


  /* =======================================================
     PLAN
  ======================================================= */

  function renderPlan() {

    const canManage =
      Permissions
        .canManagePlan(
          state.profile
        );


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>

          <h1>
            Kế hoạch kiểm thử
          </h1>

          <p>
            Quản lý các phân hệ,
            phạm vi kiểm thử của dự án.
          </p>

        </div>

        ${
          canManage
            ? `
              <button
                class="button primary"
                data-toggle="moduleForm"
              >
                + Thêm phân hệ
              </button>
            `
            : ""
        }

      </div>


      ${
        canManage
          ? `
            <section
              id="moduleForm"
              class="card form-panel hidden"
            >

              <form
                id="createModuleForm"
                class="form-grid"
              >

                <label>

                  <span>
                    Dự án
                  </span>

                  <select
                    name="project_id"
                    required
                  >

                    ${state.projects
                      .map(
                        p => `
                          <option
                            value="${p.id}"
                          >
                            ${esc(
                              p.project_name
                            )}
                          </option>
                        `
                      )
                      .join("")}

                  </select>

                </label>


                <label>

                  <span>
                    Mã phân hệ
                  </span>

                  <input
                    name="module_code"
                    required
                  >

                </label>


                <label>

                  <span>
                    Tên phân hệ
                  </span>

                  <input
                    name="module_name"
                    required
                  >

                </label>


                <label>

                  <span>
                    Đường dẫn
                  </span>

                  <input
                    name="module_url"
                  >

                </label>


                <label class="full">

                  <span>
                    Mô tả
                  </span>

                  <textarea
                    name="description"
                  ></textarea>

                </label>


                <div class="full">

                  <button
                    class="button primary"
                    type="submit"
                  >
                    Lưu phân hệ
                  </button>

                </div>

              </form>

            </section>
          `
          : ""
      }


      <div class="cards-grid">

        ${
          state.modules.length
            ? state.modules
                .map(
                  m => {

                    const project =
                      state.projects
                        .find(
                          p =>
                            p.id ===
                            m.project_id
                        );


                    const count =
                      state.testCases
                        .filter(
                          tc =>
                            tc.module_id ===
                            m.id
                        )
                        .length;


                    return `
                      <section class="card module-card">

                        <div>

                          <span class="eyebrow">
                            ${esc(
                              m.module_code ||
                              "MODULE"
                            )}
                          </span>

                          <h2>
                            ${esc(
                              m.module_name
                            )}
                          </h2>

                          <p>
                            ${esc(
                              m.description ||
                              "Không có mô tả."
                            )}
                          </p>

                        </div>


                        <div class="module-meta">

                          <span>
                            ${
                              esc(
                                project
                                  ?.project_name ||
                                ""
                              )
                            }
                          </span>

                          <strong>
                            ${count}
                            Test Case
                          </strong>

                        </div>

                      </section>
                    `;

                  }
                )
                .join("")
            : emptyHTML(
                "Chưa có phân hệ."
              )
        }

      </div>

    `;


    bindFormToggles();

    bindModuleForm();

  }


  function bindModuleForm() {

    const form =
      document.getElementById(
        "createModuleForm"
      );

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        const fd =
          new FormData(form);


        try {

          await DB.createModule({

            project_id:
              fd.get(
                "project_id"
              ),

            module_code:
              fd.get(
                "module_code"
              )
                .trim(),

            module_name:
              fd.get(
                "module_name"
              )
                .trim(),

            module_url:
              fd.get(
                "module_url"
              )
                .trim() ||
              null,

            description:
              fd.get(
                "description"
              )
                .trim() ||
              null,

            sort_order:
              state.modules.length +
              1

          });


          state.modules =
            await DB.getModules();


          toast(
            "Đã thêm phân hệ."
          );


          renderPlan();

        }

        catch (error) {

          console.error(
            error
          );

          toast(
            error.message,
            "error"
          );

        }

      }
    );

  }


  /* =======================================================
     TEST CASES
  ======================================================= */

  function renderTestCases() {

    const canCreate =
      Permissions
        .canCreateTestCase(
          state.profile
        );


    const projectMap =
      new Map(
        state.projects.map(
          p => [
            p.id,
            p
          ]
        )
      );


    const moduleMap =
      new Map(
        state.modules.map(
          m => [
            m.id,
            m
          ]
        )
      );


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>

          <h1>
            Test Case
          </h1>

          <p>
            Quản lý kịch bản
            và nội dung kiểm thử.
          </p>

        </div>

        ${
          canCreate
            ? `
              <button
                class="button primary"
                data-toggle="testCaseForm"
              >
                + Tạo Test Case
              </button>
            `
            : ""
        }

      </div>


      ${
        canCreate
          ? testCaseFormHTML()
          : ""
      }


      <section class="card">

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Mã
                </th>

                <th>
                  Test Case
                </th>

                <th>
                  Phân hệ
                </th>

                <th>
                  Dự án
                </th>

                <th>
                  Mức độ
                </th>

                <th>
                  Trạng thái
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                state.testCases.length
                  ? state.testCases
                      .map(
                        tc => `
                          <tr>

                            <td>
                              <strong>
                                ${esc(
                                  tc.test_code
                                )}
                              </strong>
                            </td>

                            <td>

                              <strong>
                                ${esc(
                                  tc.test_name
                                )}
                              </strong>

                              <small class="table-note">
                                ${esc(
                                  tc.expected_result ||
                                  ""
                                )}
                              </small>

                            </td>

                            <td>
                              ${esc(
                                moduleMap
                                  .get(
                                    tc.module_id
                                  )
                                  ?.module_name ||
                                "—"
                              )}
                            </td>

                            <td>
                              ${esc(
                                projectMap
                                  .get(
                                    tc.project_id
                                  )
                                  ?.project_name ||
                                ""
                              )}
                            </td>

                            <td>
                              <span
                                class="badge ${esc(
                                  tc.priority
                                )}"
                              >
                                ${esc(
                                  tc.priority
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                class="badge ${esc(
                                  tc.status
                                )}"
                              >
                                ${esc(
                                  tc.status
                                )}
                              </span>
                            </td>

                          </tr>
                        `
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="6"
                      >
                        ${emptyHTML(
                          "Chưa có Test Case."
                        )}
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </section>

    `;


    bindFormToggles();

    bindTestCaseProjectChange();

    bindTestCaseForm();

  }


  function testCaseFormHTML() {

    return `

      <section
        id="testCaseForm"
        class="card form-panel hidden"
      >

        <form
          id="createTestCaseForm"
          class="form-grid"
        >

          <label>

            <span>
              Dự án
            </span>

            <select
              id="tcProject"
              name="project_id"
              required
            >

              ${state.projects
                .map(
                  p => `
                    <option
                      value="${p.id}"
                    >
                      ${esc(
                        p.project_name
                      )}
                    </option>
                  `
                )
                .join("")}

            </select>

          </label>


          <label>

            <span>
              Phân hệ
            </span>

            <select
              id="tcModule"
              name="module_id"
            ></select>

          </label>


          <label>

            <span>
              Mã Test Case
            </span>

            <input
              name="test_code"
              required
            >

          </label>


          <label>

            <span>
              Ưu tiên
            </span>

            <select
              name="priority"
            >

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="critical">
                Critical
              </option>

            </select>

          </label>


          <label class="full">

            <span>
              Tên Test Case
            </span>

            <input
              name="test_name"
              required
            >

          </label>


          <label class="full">

            <span>
              Điều kiện trước
            </span>

            <textarea
              name="precondition"
            ></textarea>

          </label>


          <label class="full">

            <span>
              Các bước kiểm thử
            </span>

            <textarea
              name="test_steps"
              rows="5"
            ></textarea>

          </label>


          <label class="full">

            <span>
              Kết quả mong đợi
            </span>

            <textarea
              name="expected_result"
              rows="4"
            ></textarea>

          </label>


          <div class="full">

            <button
              type="submit"
              class="button primary"
            >
              Lưu Test Case
            </button>

          </div>

        </form>

      </section>

    `;

  }


  function bindTestCaseProjectChange() {

    const project =
      document.getElementById(
        "tcProject"
      );

    const module =
      document.getElementById(
        "tcModule"
      );


    if (
      !project ||
      !module
    ) return;


    function refresh() {

      const projectId =
        project.value;


      const list =
        state.modules
          .filter(
            m =>
              m.project_id ===
              projectId
          );


      module.innerHTML = `

        <option value="">
          -- Không chọn --
        </option>

        ${list
          .map(
            m => `
              <option
                value="${m.id}"
              >
                ${esc(
                  m.module_name
                )}
              </option>
            `
          )
          .join("")}

      `;

    }


    project.addEventListener(
      "change",
      refresh
    );


    refresh();

  }


  function bindTestCaseForm() {

    const form =
      document.getElementById(
        "createTestCaseForm"
      );

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        const fd =
          new FormData(form);


        try {

          await DB.createTestCase({

            project_id:
              fd.get(
                "project_id"
              ),

            module_id:
              fd.get(
                "module_id"
              ) || null,

            test_code:
              fd.get(
                "test_code"
              )
                .trim(),

            test_name:
              fd.get(
                "test_name"
              )
                .trim(),

            precondition:
              fd.get(
                "precondition"
              )
                .trim() ||
              null,

            test_steps:
              fd.get(
                "test_steps"
              )
                .trim() ||
              null,

            expected_result:
              fd.get(
                "expected_result"
              )
                .trim() ||
              null,

            priority:
              fd.get(
                "priority"
              ),

            status:
              "ready",

            created_by:
              state.user.id

          });


          state.testCases =
            await DB.getTestCases();


          toast(
            "Đã tạo Test Case."
          );


          renderTestCases();

        }

        catch (error) {

          console.error(
            error
          );

          toast(
            error.message,
            "error"
          );

        }

      }
    );

  }


  /* =======================================================
     DEFECTS
  ======================================================= */

  function renderDefects() {

    const canCreate =
      Permissions
        .canCreateDefect(
          state.profile
        );


    const tcMap =
      new Map(
        state.testCases.map(
          item => [
            item.id,
            item
          ]
        )
      );


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>

          <h1>
            Quản lý lỗi
          </h1>

          <p>
            Theo dõi lỗi phát hiện
            trong quá trình kiểm thử.
          </p>

        </div>

        ${
          canCreate
            ? `
              <button
                class="button primary"
                data-toggle="defectForm"
              >
                + Ghi nhận lỗi
              </button>
            `
            : ""
        }

      </div>


      ${
        canCreate
          ? defectFormHTML()
          : ""
      }


      <section class="card">

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Mã lỗi
                </th>

                <th>
                  Nội dung
                </th>

                <th>
                  Test Case
                </th>

                <th>
                  Severity
                </th>

                <th>
                  Priority
                </th>

                <th>
                  Trạng thái
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                state.defects.length
                  ? state.defects
                      .map(
                        defect => `
                          <tr>

                            <td>
                              <strong>
                                ${esc(
                                  defect.defect_code
                                )}
                              </strong>
                            </td>

                            <td>
                              ${esc(
                                defect.title
                              )}
                            </td>

                            <td>
                              ${esc(
                                tcMap
                                  .get(
                                    defect.test_case_id
                                  )
                                  ?.test_code ||
                                "—"
                              )}
                            </td>

                            <td>
                              <span
                                class="badge ${esc(
                                  defect.severity
                                )}"
                              >
                                ${esc(
                                  defect.severity
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                class="badge ${esc(
                                  defect.priority
                                )}"
                              >
                                ${esc(
                                  defect.priority
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                class="badge ${esc(
                                  defect.status
                                )}"
                              >
                                ${esc(
                                  defect.status
                                )}
                              </span>
                            </td>

                          </tr>
                        `
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="6"
                      >
                        ${emptyHTML(
                          "Chưa có lỗi."
                        )}
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </section>

    `;


    bindFormToggles();

    bindDefectForm();

  }


  function defectFormHTML() {

    return `

      <section
        id="defectForm"
        class="card form-panel hidden"
      >

        <form
          id="createDefectForm"
          class="form-grid"
        >

          <label>

            <span>
              Dự án
            </span>

            <select
              name="project_id"
              required
            >

              ${state.projects
                .map(
                  p => `
                    <option
                      value="${p.id}"
                    >
                      ${esc(
                        p.project_name
                      )}
                    </option>
                  `
                )
                .join("")}

            </select>

          </label>


          <label>

            <span>
              Test Case
            </span>

            <select
              name="test_case_id"
            >

              <option value="">
                -- Không chọn --
              </option>

              ${state.testCases
                .map(
                  tc => `
                    <option
                      value="${tc.id}"
                    >
                      ${esc(
                        tc.test_code
                      )}
                      -
                      ${esc(
                        tc.test_name
                      )}
                    </option>
                  `
                )
                .join("")}

            </select>

          </label>


          <label>

            <span>
              Mã lỗi
            </span>

            <input
              name="defect_code"
              required
            >

          </label>


          <label>

            <span>
              Severity
            </span>

            <select
              name="severity"
            >
              <option value="low">
                Low
              </option>
              <option value="medium">
                Medium
              </option>
              <option value="high">
                High
              </option>
              <option value="critical">
                Critical
              </option>
            </select>

          </label>


          <label class="full">

            <span>
              Tiêu đề lỗi
            </span>

            <input
              name="title"
              required
            >

          </label>


          <label class="full">

            <span>
              Mô tả
            </span>

            <textarea
              name="description"
              rows="5"
            ></textarea>

          </label>


          <div class="full">

            <button
              type="submit"
              class="button primary"
            >
              Lưu lỗi
            </button>

          </div>

        </form>

      </section>

    `;

  }


  function bindDefectForm() {

    const form =
      document.getElementById(
        "createDefectForm"
      );

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        const fd =
          new FormData(form);


        try {

          await DB.createDefect({

            project_id:
              fd.get(
                "project_id"
              ),

            test_case_id:
              fd.get(
                "test_case_id"
              ) || null,

            defect_code:
              fd.get(
                "defect_code"
              )
                .trim(),

            title:
              fd.get(
                "title"
              )
                .trim(),

            description:
              fd.get(
                "description"
              )
                .trim() ||
              null,

            severity:
              fd.get(
                "severity"
              ),

            priority:
              "medium",

            status:
              "open",

            reported_by:
              state.user.id

          });


          state.defects =
            await DB.getDefects();


          toast(
            "Đã ghi nhận lỗi."
          );


          renderDefects();

        }

        catch (error) {

          console.error(
            error
          );

          toast(
            error.message,
            "error"
          );

        }

      }
    );

  }


  /* =======================================================
     REPORT
  ======================================================= */

  function renderReports() {

    const latest =
      latestRunMap();


    const rows =
      state.projects
        .map(
          project => {

            const cases =
              state.testCases
                .filter(
                  tc =>
                    tc.project_id ===
                    project.id
                );


            let pass = 0;
            let fail = 0;
            let blocked = 0;


            cases.forEach(
              tc => {

                const run =
                  latest.get(tc.id);


                if (
                  run?.result ===
                  "PASS"
                ) pass++;


                if (
                  run?.result ===
                  "FAIL"
                ) fail++;


                if (
                  run?.result ===
                  "BLOCKED"
                ) blocked++;

              }
            );


            const defects =
              state.defects
                .filter(
                  d =>
                    d.project_id ===
                    project.id
                ).length;


            return {

              project,

              total:
                cases.length,

              pass,

              fail,

              blocked,

              defects

            };

          }
        );


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>

          <h1>
            Báo cáo kiểm thử
          </h1>

          <p>
            Tổng hợp kết quả
            theo từng dự án.
          </p>

        </div>

      </div>


      <section class="card">

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Dự án
                </th>

                <th>
                  Test Case
                </th>

                <th>
                  Pass
                </th>

                <th>
                  Fail
                </th>

                <th>
                  Blocked
                </th>

                <th>
                  Defect
                </th>

                <th>
                  Tiến độ
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                rows.length
                  ? rows
                      .map(
                        row => {

                          const done =
                            row.pass +
                            row.fail +
                            row.blocked;


                          const percent =
                            row.total
                              ? Math.round(
                                  done /
                                  row.total *
                                  100
                                )
                              : 0;


                          return `
                            <tr>

                              <td>
                                <strong>
                                  ${esc(
                                    row.project
                                      .project_name
                                  )}
                                </strong>
                              </td>

                              <td>
                                ${row.total}
                              </td>

                              <td class="text-success">
                                ${row.pass}
                              </td>

                              <td class="text-danger">
                                ${row.fail}
                              </td>

                              <td class="text-warning">
                                ${row.blocked}
                              </td>

                              <td>
                                ${row.defects}
                              </td>

                              <td>
                                ${percent}%
                              </td>

                            </tr>
                          `;

                        }
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="7"
                      >
                        ${emptyHTML(
                          "Chưa có dữ liệu."
                        )}
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </section>

    `;

  }


  /* =======================================================
     MEMBERS
  ======================================================= */

  async function renderMembers() {

    try {

      state.profiles =
        await DB.getProfiles();

      state.members =
        await DB.getProjectMembers();

    }

    catch (error) {

      console.error(error);

    }


    const canManage =
      Permissions
        .canManageMembers(
          state.profile
        );


    const profileMap =
      new Map(
        state.profiles.map(
          p => [
            p.id,
            p
          ]
        )
      );


    const projectMap =
      new Map(
        state.projects.map(
          p => [
            p.id,
            p
          ]
        )
      );


    const content =
      document.getElementById(
        "pageContent"
      );


    content.innerHTML = `

      <div class="page-heading">

        <div>

          <h1>
            Thành viên
          </h1>

          <p>
            Quản lý tài khoản
            và vai trò trong dự án.
          </p>

        </div>

        ${
          canManage
            ? `
              <button
                class="button primary"
                data-toggle="memberForm"
              >
                + Phân quyền dự án
              </button>
            `
            : ""
        }

      </div>


      ${
        canManage
          ? `
            <section
              id="memberForm"
              class="card form-panel hidden"
            >

              <form
                id="addMemberForm"
                class="form-grid"
              >

                <label>

                  <span>
                    Dự án
                  </span>

                  <select
                    name="project_id"
                  >

                    ${state.projects
                      .map(
                        p => `
                          <option
                            value="${p.id}"
                          >
                            ${esc(
                              p.project_name
                            )}
                          </option>
                        `
                      )
                      .join("")}

                  </select>

                </label>


                <label>

                  <span>
                    Người dùng
                  </span>

                  <select
                    name="user_id"
                  >

                    ${state.profiles
                      .map(
                        p => `
                          <option
                            value="${p.id}"
                          >
                            ${esc(
                              p.full_name ||
                              p.email
                            )}
                            (${esc(
                              p.email
                            )})
                          </option>
                        `
                      )
                      .join("")}

                  </select>

                </label>


                <label>

                  <span>
                    Vai trò dự án
                  </span>

                  <select
                    name="role"
                  >

                    <option value="manager">
                      Manager
                    </option>

                    <option value="tester">
                      Tester
                    </option>

                    <option value="viewer">
                      Viewer
                    </option>

                  </select>

                </label>


                <div>

                  <button
                    class="button primary"
                    type="submit"
                  >
                    Lưu phân quyền
                  </button>

                </div>

              </form>

            </section>
          `
          : ""
      }


      <section class="card">

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Người dùng
                </th>

                <th>
                  Email
                </th>

                <th>
                  Quyền hệ thống
                </th>

                <th>
                  Dự án
                </th>

                <th>
                  Quyền dự án
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                state.members.length
                  ? state.members
                      .map(
                        m => {

                          const p =
                            profileMap
                              .get(
                                m.user_id
                              );


                          const project =
                            projectMap
                              .get(
                                m.project_id
                              );


                          return `
                            <tr>

                              <td>
                                <strong>
                                  ${esc(
                                    p?.full_name ||
                                    "—"
                                  )}
                                </strong>
                              </td>

                              <td>
                                ${esc(
                                  p?.email ||
                                  ""
                                )}
                              </td>

                              <td>
                                ${esc(
                                  Permissions
                                    .label(
                                      p?.role
                                    )
                                )}
                              </td>

                              <td>
                                ${esc(
                                  project
                                    ?.project_name ||
                                  ""
                                )}
                              </td>

                              <td>
                                <span
                                  class="badge"
                                >
                                  ${esc(
                                    m.role
                                  )}
                                </span>
                              </td>

                            </tr>
                          `;

                        }
                      )
                      .join("")
                  : `
                    <tr>
                      <td
                        colspan="5"
                      >
                        ${emptyHTML(
                          "Chưa có thành viên."
                        )}
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>

      </section>

    `;


    bindFormToggles();

    bindMemberForm();

  }


  function bindMemberForm() {

    const form =
      document.getElementById(
        "addMemberForm"
      );

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        const fd =
          new FormData(form);


        try {

          await DB.upsertProjectMember({

            project_id:
              fd.get(
                "project_id"
              ),

            user_id:
              fd.get(
                "user_id"
              ),

            role:
              fd.get(
                "role"
              )

          });


          toast(
            "Đã cập nhật phân quyền."
          );


          await renderMembers();

        }

        catch (error) {

          console.error(
            error
          );

          toast(
            error.message,
            "error"
          );

        }

      }
    );

  }


  /* =======================================================
     COMMON
  ======================================================= */

  function bindFormToggles() {

    document
      .querySelectorAll(
        "[data-toggle]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            function () {

              const id =
                button.dataset
                  .toggle;


              document
                .getElementById(id)
                ?.classList
                .toggle("hidden");

            }
          );

        }
      );

  }


  /* =======================================================
     INIT
  ======================================================= */

  async function init() {

    const root =
      document.getElementById(
        "app"
      );

    if (!root) return;


    try {

      const session =
        await Auth.requireAuth();


      if (!session) {
        return;
      }


      state.user =
        session.user;


      state.profile =
        await DB.getProfile(
          state.user.id
        );


      if (
        !state.profile ||
        state.profile.active === false
      ) {

        await Auth.logout();

        return;

      }


      const page =
        document.body.dataset.page ||
        "dashboard";


      renderShell(page);


      await loadBaseData();


      switch (page) {

        case "projects":

          renderProjects();

          break;


        case "plan":

          renderPlan();

          break;


        case "testcases":

          renderTestCases();

          break;


        case "defects":

          renderDefects();

          break;


        case "reports":

          renderReports();

          break;


        case "members":

          await renderMembers();

          break;


        default:

          renderDashboard();

      }

    }

    catch (error) {

      console.error(
        error
      );


      const content =
        document.getElementById(
          "pageContent"
        );


      if (content) {

        content.innerHTML = `

          <div class="error-box">

            <strong>
              Không thể tải dữ liệu.
            </strong>

            <p>
              ${esc(
                error.message
              )}
            </p>

          </div>

        `;

      }

    }

  }


  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
