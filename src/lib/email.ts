import { Resend } from "resend";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return new Resend(apiKey);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY is required in production.");
  }
  return null;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  fullName: string,
): Promise<void> {
  const client = getResendClient();

  if (!client) {
    // Local dev without a Resend account: surface the link instead of failing silently.
    console.log(`[dev] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #062619;">
      <h2 style="margin-bottom: 8px;">إعادة تعيين كلمة المرور</h2>
      <p>مرحباً ${fullName}،</p>
      <p>وصلنا طلب لإعادة تعيين كلمة مرور حسابك في خلّيها ترند. اضغط الرابط بالأسفل لتعيين كلمة مرور جديدة (صالح لمدة ساعة واحدة فقط):</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#d6f61d; color:#062619; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">تعيين كلمة مرور جديدة</a>
      </p>
      <p style="font-size: 13px; color: #666;">إذا لم تطلب هذا، تجاهل هذي الرسالة ولن يتغير شي بحسابك.</p>
    </div>
  `;

  await client.emails.send({
    from: "خلّيها ترند <onboarding@resend.dev>",
    to,
    subject: "إعادة تعيين كلمة المرور - خلّيها ترند",
    html,
  });
}
