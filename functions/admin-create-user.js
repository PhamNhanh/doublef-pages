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

function serviceHeaders(secret, extra = {}) {
  const headers = { apikey: secret, ...extra };
  // Legacy service_role keys are JWTs and require Bearer auth.
  if (secret && secret.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}

async function serviceFetch(url, secret, options = {}) {
  const headers = serviceHeaders(secret, options.headers || {});
  let response = await fetch(url, { ...options, headers });

  // Some Auth gateway configurations also accept modern secret keys as Bearer.
  // Retry once only when the first request is unauthorized.
  if (response.status === 401 && secret?.startsWith("sb_secret_")) {
    response = await fetch(url, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${secret}` }
    });
  }
  return response;
}

async function verifyCallerIsAdmin(request, secret) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Bạn chưa đăng nhập." };
  }

  const token = authorization.slice(7).trim();
  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!userResp.ok) {
    return { ok: false, status: 401, message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." };
  }

  const caller = await userResp.json();
  const profileResp = await serviceFetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=id,role,active`,
    secret,
    { headers: { Accept: "application/json" } }
  );

  if (!profileResp.ok) {
    return { ok: false, status: 500, message: "Không kiểm tra được quyền quản trị." };
  }

  const profiles = await profileResp.json();
  const profile = profiles?.[0];
  if (!profile || profile.active !== true || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Chỉ tài khoản Admin được phép tạo tài khoản mới." };
  }

  return { ok: true, caller };
}

export async function onRequestPost(context) {
  const secret = context.env.SUPABASE_SECRET_KEY || context.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    return json({ error: "Chưa cấu hình SUPABASE_SECRET_KEY trên Cloudflare." }, 500);
  }

  const auth = await verifyCallerIsAdmin(context.request, secret);
  if (!auth.ok) return json({ error: auth.message }, auth.status);

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
    return json({ error: "Vui lòng nhập họ tên." }, 400);
  }
  if (!["admin", "manager", "tester", "viewer"].includes(role)) {
    return json({ error: "Vai trò hệ thống không hợp lệ." }, 400);
  }

  const createResp = await serviceFetch(`${SUPABASE_URL}/auth/v1/admin/users`, secret, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
  });

  const createPayload = await createResp.json().catch(() => ({}));
  if (!createResp.ok) {
    const message = createPayload?.msg || createPayload?.message || createPayload?.error_description || createPayload?.error || "Không tạo được tài khoản.";
    return json({ error: message }, createResp.status === 422 ? 409 : createResp.status);
  }

  const newUser = createPayload.user || createPayload;
  if (!newUser?.id) {
    return json({ error: "Supabase đã tạo tài khoản nhưng không trả về mã người dùng." }, 500);
  }

  const updateResp = await serviceFetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(newUser.id)}`,
    secret,
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

  if (!updateResp.ok) {
    // Roll back the Auth account when profile initialization fails.
    await serviceFetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(newUser.id)}`, secret, {
      method: "DELETE"
    }).catch(() => null);

    const details = await updateResp.text().catch(() => "");
    return json({ error: "Không khởi tạo được hồ sơ người dùng.", details }, 500);
  }

  const profileRows = await updateResp.json().catch(() => []);
  return json({
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
  }, 201);
}
