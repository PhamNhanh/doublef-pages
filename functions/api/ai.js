export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return jsonResponse(
        {
          error: "Nội dung câu hỏi không được để trống."
        },
        400
      );
    }

    if (message.length > 10000) {
      return jsonResponse(
        {
          error: "Nội dung câu hỏi quá dài."
        },
        400
      );
    }

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      "gemini-2.0-flash:generateContent?key=" +
      encodeURIComponent(env.GEMINI_API_KEY);

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: message
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("Gemini API error:", data);

      return jsonResponse(
        {
          error: "Dịch vụ AI đang gặp lỗi."
        },
        aiResponse.status
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim() || "AI không trả về nội dung.";

    return jsonResponse({
      answer
    });
  } catch (error) {
    console.error("AI Function error:", error);

    return jsonResponse(
      {
        error: "Không thể xử lý yêu cầu."
      },
      500
    );
  }
}

export async function onRequestGet() {
  return jsonResponse({
    status: "ok",
    message: "DoubleF AI API đang hoạt động."
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
