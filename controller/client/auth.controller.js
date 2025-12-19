const md5 = require("md5");

const User = require("../../model/User");
const ForgotPassword = require("../../model/ForgotPassword");

const generateHelpers = require("../../utils/generate");
const sendMailHelpers = require("../../utils/sendMail");

// [GET] /auth/register
module.exports.register = (req, res) => {
  res.render("client/pages/auth/register", {
    pageTitle: "Đăng ký tài khoản"
  });
};

// [POST] /auth/register
module.exports.registerPost = async (req, res) => {
  const exitsEmail = await User.findOne({
    email: req.body.email,
    deleted: false,
  });

  if (exitsEmail) {
    req.flash("error", "Email đã tồn tại !");
    res.redirect("/auth/register");
    return;
  }
  
  if (req.body.password) {
    req.body.password = md5(req.body.password);
  }

  const user = new User(req.body);
  if (!user.avatar) {
    user.avatar = '/client/img/avatar.png';
  }
  await user.save();

  res.cookie("tokenUser", user.tokenUser);

  req.flash("success", "Đăng ký thành công!");
  res.redirect("/");
};

// [GET] /auth/login
module.exports.login = (req, res) => {
  res.render("client/pages/auth/login", {
    pageTitle: "Đăng nhập"
  });
};

// [POST] /auth/login
module.exports.loginPost = async (req, res) => {
  const emailOrUsername = req.body.email;
  const password = req.body.password;

  // Tìm user bằng email
  const user = await User.findOne({
    email: emailOrUsername,
    deleted: false,
  });

  if (!user) {
    req.flash("error", `Email không tồn tại!`);
    res.redirect("/auth/login");
    return;
  }

  if (md5(password) != user.password) {
    req.flash("error", `Sai mật khẩu!`);
    res.redirect("/auth/login");
    return;
  }

  if (user.status == "inactive") {
    req.flash("error", `Tài khoản đang bị khoá !`);
    res.redirect("/auth/login");
    return;
  }

  // Cập nhật trạng thái online
  await User.updateOne(
    { _id: user.id },
    {
      statusOnline: "online",
      lastLogin: new Date()
    }
  );

  // Chỉ lưu cookie cho tất cả user
  res.cookie("tokenUser", user.tokenUser);
  
  req.flash("success", "Đăng nhập thành công!");
  res.redirect("/");
};

// [GET] /auth/logout
module.exports.logout = async (req, res) => {
  if (res.locals.user) {
    await User.updateOne(
      { _id: res.locals.user.id },
      {
        statusOnline: "offline",
      }
    );
  }

  // Chỉ xóa cookie
  res.clearCookie("tokenUser");

  res.redirect("/");
};

// [GET] /auth/password/forgot
module.exports.forgotPassword = (req, res) => {
  res.render("client/pages/auth/forgot-password", {
    pageTitle: "Lấy lại mật khẩu",
  });
};

// [POST] /auth/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
  const email = req.body.email;

  const user = await User.findOne({
    email: email,
    deleted: false,
  });

  if (!user) {
    req.flash("error", `Email không tồn tại !`);
    res.redirect("/auth/password/forgot");
    return;
  }

  // Việc 1: Tạo mã OTP và lưu OTP, email vào collection forgot-password
  const otp = generateHelpers.generateRandomNumber(8);

  const objectForgotPassword = {
    email: email,
    otp: otp,
    expireAt: Date.now(),
  };

  const forgotPassword = new ForgotPassword(objectForgotPassword);
  await forgotPassword.save();

  // Việc 2: Gửi mã OTP qua email của user
  const subject = `Mã OTP xác minh lấy lại mật khẩu`;
  const html = `
    Mã OTP xác minh mật khẩu là: <b>${otp}</b>. Thời hạn sử dụng là 3 phút .Lưu ý không được để lộ mã OTP
  `;

  sendMailHelpers.sendMail(email, subject, html);

  res.redirect(`/auth/password/otp?email=${email}`);
};

// [GET] /auth/password/otp
module.exports.otpPassword = (req, res) => {
  const email = req.query.email;

  res.render("client/pages/auth/otp-password", {
    pageTitle: "Nhập mã OTP",
    email: email,
  });
};

// [POST] /auth/password/otp
module.exports.otpPasswordPost = async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;

  const result = await ForgotPassword.findOne({
    email: email,
    otp: otp,
  });

  if (!result) {
    req.flash("error", `OTP không hợp lệ!`);
    res.redirect(`/auth/password/otp?email=${email}`);
    return;
  }

  const user = await User.findOne({
    email: email,
  });

  res.cookie("tokenUser", user.tokenUser);

  res.redirect("/auth/password/reset");
};

// [GET] /auth/password/reset
module.exports.resetPassword = (req, res) => {
  res.render("client/pages/auth/reset-password", {
    pageTitle: "Đổi mật khẩu",
  });
};

// [POST] /auth/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password;
  const tokenUser = req.cookies.tokenUser;

  await User.updateOne(
    {
      tokenUser: tokenUser,
    },
    {
      password: md5(password),
    }
  );

  req.flash("success", "Tạo mật khẩu thành công");

  res.redirect("/");
};

// [GET] /auth/info
module.exports.info = (req, res) => {
  res.render("client/pages/auth/info", {
    pageTitle: "Thông tin tài khoản",
    user: res.locals.user
  });
};

// [POST] /auth/info - cập nhật avatar + fullName
module.exports.infoPost = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      req.flash('error', 'Vui lòng đăng nhập');
      return res.redirect('/auth/login');
    }

    console.log('🔍 Avatar upload debug:');
    console.log('  req.file:', req.file);
    console.log('  req.body:', req.body);

    const updates = {};

    if (req.body.fullName && String(req.body.fullName).trim()) {
      updates.fullName = String(req.body.fullName).trim();
    }

    if (req.file) {
      // Sử dụng secure_url từ Cloudinary
      updates.avatar = req.file.secure_url || req.file.path;
    }

    if (Object.keys(updates).length === 0) {
      req.flash('warning', 'Không có gì để cập nhật');
      return res.redirect('/auth/info');
    }

    console.log('💾 Updating user with:', updates);
    await User.updateOne({ _id: user._id }, updates);

    // update in response locals for immediate render
    Object.assign(res.locals.user, updates);

    req.flash('success', 'Cập nhật thông tin thành công');
    res.redirect('/auth/info');
  } catch (err) {
    console.error('❌ Update user info error:', err);
    req.flash('error', 'Không thể cập nhật thông tin lúc này');
    res.redirect('/auth/info');
  }
};
