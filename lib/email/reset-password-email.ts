const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildResetPasswordEmail(url: string, expiresInMinutes: number) {
  const safeUrl = escapeHtml(url);
  const expiry = `${expiresInMinutes} minutes`;

  return {
    subject: "Reset your Lipi password",
    text: [
      "We received a request to reset your Lipi password.",
      `Open this link within ${expiry} to choose a new password:`,
      url,
      "If you did not ask for this, you can ignore this email. Your password stays the same.",
    ].join("\n\n"),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#111111;background:#ffffff;">
    <h1 style="font-size:20px;margin:0 0 16px;">Reset your password</h1>
    <p>We received a request to reset your Lipi password. This link works for ${expiry}.</p>
    <p><a href="${safeUrl}" style="display:inline-block;padding:10px 16px;background:#111111;color:#ffffff;text-decoration:underline;border-radius:6px;">Choose a new password</a></p>
    <p>If the button does not work, copy this address into your browser:<br><a href="${safeUrl}" style="color:#111111;word-break:break-all;">${safeUrl}</a></p>
    <p>If you did not ask for this, you can ignore this email. Your password stays the same.</p>
  </body>
</html>`,
  };
}
