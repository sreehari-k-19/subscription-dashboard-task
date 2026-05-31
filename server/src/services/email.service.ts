import { Resend } from "resend";
import { env } from "../config/env";

const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  try {
    const { error } = await client.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    // Email failure must never break the main request flow
    console.error("[email] send threw:", err);
  }
}

function fmt(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function base(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#4f46e5;padding:24px 32px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;">⚡ SubDash</span>
          </td>
        </tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">
              You received this email because you have an account at SubDash.
              If you did not expect this, you can ignore it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Welcome, ${name}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;">Your SubDash account is ready. Explore plans and start your subscription anytime.</p>
    <a href="${env.CLIENT_URL}/plans"
       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
      Browse Plans
    </a>
  `);
  await send(to, "Welcome to SubDash!", html);
}

// ─── Subscription confirmed ───────────────────────────────────────────────────

export async function sendSubscriptionConfirmationEmail(
  to: string,
  name: string,
  planName: string,
  billingCycle: string,
  endDate: Date
): Promise<void> {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Subscription Confirmed ✅</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;">Hi ${name}, your <strong>${planName}</strong> subscription is now active.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9f9fb;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#71717a;border-bottom:1px solid #f0f0f1;">Plan</td>
        <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181b;border-bottom:1px solid #f0f0f1;">${planName}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#71717a;border-bottom:1px solid #f0f0f1;">Billing</td>
        <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181b;border-bottom:1px solid #f0f0f1;">${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#71717a;">Renews</td>
        <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181b;">${fmt(endDate)}</td>
      </tr>
    </table>
    <a href="${env.CLIENT_URL}/billing"
       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
      View Billing
    </a>
  `);
  await send(to, `Subscription Confirmed — ${planName}`, html);
}

// ─── Expiry warning ───────────────────────────────────────────────────────────

export async function sendExpiryWarningEmail(
  to: string,
  name: string,
  expiresAt: Date
): Promise<void> {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Your Subscription Expires Soon ⏰</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#52525b;">Hi ${name}, your subscription expires on <strong>${fmt(expiresAt)}</strong>.</p>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;">Renew now to keep uninterrupted access to all features.</p>
    <a href="${env.CLIENT_URL}/plans"
       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
      Renew Subscription
    </a>
  `);
  await send(to, "Your Subscription Expires in 3 Days", html);
}

// ─── Payment failed ───────────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  gracePeriodEndsAt: Date
): Promise<void> {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Payment Failed ⚠️</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#52525b;">Hi ${name}, we couldn't process your latest payment.</p>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;">
      Your access continues until <strong>${fmt(gracePeriodEndsAt)}</strong>.
      Please update your payment method before then to avoid losing access.
    </p>
    <a href="${env.CLIENT_URL}/billing"
       style="display:inline-block;padding:12px 24px;background:#ef4444;color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
      Update Payment
    </a>
  `);
  await send(to, "Action Required: Payment Failed", html);
}
