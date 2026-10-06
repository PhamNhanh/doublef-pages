const SUPABASE_URL = "https://aizhygivtngtsqcjtvaj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_T5kmdBx5e9EdE7WMxj3J4w_BWiJi8MN";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function getAdminCredential(env) {
  const serviceRole = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const secretKey = String(env.SUPABASE_SECRET_KEY || "").trim();

  if (serviceRole) {
    return {
      type: "service_role",
      value: serviceRole,
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`
      }
    };
  }

  if (secretKey) {
    return {
      type: "secret",
      value: secretKey,
      headers: {
        apikey: secretKey
      }
    };
  }

  return null;
}

async function adminFetch(env, url, options = {}) {
  const credential = getAdminCredential(env);

  if (!credential) {
    return { credential: null, response: null };
  }

  const headers = {
    ...credential.headers,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  return { credential, response };
}

async function verifyCallerIsAdmin(request, env) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Bạn chưa đăng nhập." };
  }

  const token = authorization.slice(7).trim();

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!userResponse.ok) {
    return {
      ok: false,
      status: 401,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
    };
  }

  const caller = await userResponse.json();

  const { credential, response } = await adminFetch(
    env,
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=id,role,active`,
    { headers: { Accept: "application/json" } }
  );

  if (!credential) {
    return {
      ok: false,
      status: 500,
      message: "Cloudflare chưa có SUPABASE_SERVICE_ROLE_KEY hoặc SUPABASE_SECRET_KEY."
    };
  }

  if (!response || !response.ok) {
    const details = response ? await response.text().catch(() => "") : "";
    return {
      ok: false,
      status: 500,
      message: "Không kiểm tra được quyền quản trị.",
      details
    };
  }

  const rows = await response.json();
  const profile = rows?.[0];

  if (!profile || profile.active !== true || profile.role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "Chỉ tài khoản Admin được phép tạo tài khoản mới."
    };
  }

  return { ok: true, caller, credentialType: credential.type };
}

export async function onRequestGet(context) {
  const credential = getAdminCredential(context.env);

  return json({
    ok: true,
    function: "admin-create-user",
    route: "/api/admin-create-user",
    credentialConfigured: Boolean(credential),
    credentialType: credential?.type || null
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  try {
    const credential = getAdminCredential(context.env);

    if (!credential) {
      return json(
        { error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY hoặc SUPABASE_SECRET_KEY trên Cloudflare." },
        500
      );
    }

    const auth = await verifyCallerIsAdmin(context.request, context.env);
    if (!auth.ok) {
      return json({ error: auth.message, details: auth.details || null }, auth.status);
    }

    let body;
    try {
      body = await context.request.json();
    } catch {
      return json({ error: "Dữ liệu gửi lên không hợp lệ." }, 400);
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();
    const department = String(body.department || "").trim();
    const phone = String(body.phone || "").trim();
    const role = String(body.role || "viewer").trim().toLowerCase();
    const active = body.active !== false;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Email không hợp lệ." }, 400);
    }
    if (password.length < 8) {
      return json({ error: "Mật khẩu phải có ít nhất 8 ký tự." }, 400);
    }
    if (!fullName) {
      return json({ error: "Vui lòng nhập họ và tên." }, 400);
    }
    if (!["admin", "manager", "tester", "viewer"].includes(role)) {
      return json({ error: "Vai trò hệ thống không hợp lệ." }, 400);
    }

    const createResult = await adminFetch(
      context.env,
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        })
      }
    );

    const createResponse = createResult.response;
    const rawCreate = createResponse ? await createResponse.text().catch(() => "") : "";

    let createPayload = {};
    try {
      createPayload = rawCreate ? JSON.parse(rawCreate) : {};
    } catch {
      createPayload = {};
    }

    if (!createResponse || !createResponse.ok) {
      const upstreamMessage =
        createPayload?.msg ||
        createPayload?.message ||
        createPayload?.error_description ||
        createPayload?.error ||
        rawCreate ||
        "Không tạo được tài khoản trên Supabase Auth.";

      const badJwt =
        String(upstreamMessage).toLowerCase().includes("jwt") ||
        createPayload?.error_code === "bad_jwt";

      if (badJwt && createResult.credential?.type === "secret") {
        return json(
          {
            error: "Supabase Auth Admin đang từ chối sb_secret_ cho thao tác tạo user. Hãy cấu hình thêm SUPABASE_SERVICE_ROLE_KEY trên Cloudflare rồi deploy lại.",
            upstream_status: createResponse.status,
            upstream_error: upstreamMessage
          },
          502
        );
      }

      return json(
        {
          error: upstreamMessage,
          upstream_status: createResponse.status
        },
        createResponse.status === 422 ? 409 : createResponse.status
      );
    }

    const newUser = createPayload.user || createPayload;

    if (!newUser?.id) {
      return json(
        {
          error: "Supabase đã phản hồi thành công nhưng không trả về mã người dùng.",
          response: createPayload
        },
        500
      );
    }

    const updateResult = await adminFetch(
      context.env,
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(newUser.id)}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role,
          department: department || null,
          phone: phone || null,
          active
        })
      }
    );

    if (!updateResult.response?.ok) {
      const details = updateResult.response
        ? await updateResult.response.text().catch(() => "")
        : "";

      return json(
        {
          error: "Tài khoản Auth đã được tạo nhưng không cập nhật được hồ sơ profiles.",
          user_id: newUser.id,
          details
        },
        500
      );
    }

    const profileRows = await updateResult.response.json().catch(() => []);

    return json(
      {
        ok: true,
        user: {
          id: newUser.id,
          email,
          full_name: fullName,
          role,
          department: department || null,
          phone: phone || null,
          active,
          profile: profileRows?.[0] || null
        }
      },
      201
    );
  } catch (error) {
    return json(
      {
        error: "Lỗi máy chủ khi tạo tài khoản.",
        details: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
}
