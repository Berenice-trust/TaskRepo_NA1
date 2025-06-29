const nodemailer = require("nodemailer");

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465", // true для 465, false для других портов
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function sendVerificationEmail(to, username, token) {

     // Проверка тестового режима
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_EMAILS === 'true') {
    console.log(`[TEST] Письмо не отправлено (режим тестирования): ${to}, токен: ${token}`);
    return { messageId: 'test-email-skip', success: true };
  }

  // URL для активации аккаунта, реальная отправка
  const activationUrl = `http://${process.env.HOST}:${process.env.PORT}/activate?token=${token}`;


  // Тема письма
  const subject = "Подтверждение регистрации на Novelune";

  // Тело письма в формате HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">Добро пожаловать на Novelune!</h2>
      <p>Здравствуйте, <strong>${username}</strong>!</p>
      <p>Спасибо за регистрацию на нашей платформе. Для активации аккаунта, пожалуйста, нажмите на кнопку ниже:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationUrl}" style="background-color: #5C6BC0; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Активировать аккаунт
        </a>
      </div>
      <p>Или перейдите по ссылке: <a href="${activationUrl}">${activationUrl}</a></p>
      <p>Если вы не регистрировались на Novelune, просто проигнорируйте это письмо.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #777; font-size: 12px;">© ${new Date().getFullYear()} Novelune. Все права защищены.</p>
    </div>
  `;

  // Отправляем email
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
};
