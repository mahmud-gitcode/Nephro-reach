/* Small formatting helpers, pulled out of the page so they can be tested
   without rendering 2,400 lines of it. */

export function formatNowStamp(language: string) {
  const now = new Date();
  const locale = language === "ES" ? "es-ES" : "en-US";
  const date = now.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  const time = now.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}
