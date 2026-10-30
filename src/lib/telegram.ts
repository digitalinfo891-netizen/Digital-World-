import "server-only";

export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.error("[Telegram] Missing bot token or group chat ID.");
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.ok !== true) {
      console.error("[Telegram] Delivery failed:", {
        status: response.status,
        description: result?.description || "Unknown Telegram API error",
        errorCode: result?.error_code || null,
      });
      return;
    }

    console.log("[Telegram] Message delivered successfully.");
  } catch (error) {
    console.error(
      "[Telegram] Delivery error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export function telegramTimestamp(): string {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " IST";
}
