const nodemailer = require("nodemailer");

module.exports.sendMail = (email, subject, html) => {
  // Cấu hình email trực tiếp
  const emailUser = "hanoivibess@gmail.com";
  const emailPassword = "ixhx ebhl ypdr novd";
  const smtpHost = "smtp.gmail.com";
  const smtpPort = 587;

  console.log('📧 Email configuration (hardcoded):');
  console.log('User:', emailUser);
  console.log('Host:', smtpHost);
  console.log('Port:', smtpPort);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: subject,
    html: html,
  };

  console.log('📤 Sending email to:', email);
  console.log('📤 Subject:', subject);

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error('❌ Email sending failed:', error);
      throw error; // Throw error để controller có thể catch
    } else {
      console.log('✅ Email sent successfully:', info.response);
    }
  });
};
