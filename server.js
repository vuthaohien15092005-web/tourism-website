const express = require("express");
const path = require("path");
const http = require("http");
const session = require("express-session");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const database = require("./config/database");
const route = require("./routes/client/index.route");
const routeAdmin = require("./routes/admin/index.route");
const apiChatRouter = require('./routes/api/chat.route');
const apiNearbyPlacesRouter = require('./routes/api/nearby-places.route');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve uploads directory separately for better caching
app.use('/uploads', express.static(path.join(__dirname, "public/uploads")));

// Parse nested fields from forms (e.g. ticket_info[normal], map[lat])
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Support PUT/DELETE from HTML forms via _method
app.use(methodOverride('_method'));

// (Removed verbose per-request admin logging)

// Set explicit timeouts and surface 504 instead of hanging
app.use((req, res, next) => {
  req.setTimeout(60 * 1000); // 60s
  res.setTimeout(60 * 1000, () => {
    if (!res.headersSent) {
      console.warn(`[TIMEOUT] ${req.method} ${req.originalUrl}`);
      res.status(504).send('Request timeout');
    }
  });
  next();
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'tourism-hanoi-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages
app.use(flash());

// Load user middleware
const User = require('./model/User');
app.use(async (req, res, next) => {
  // Load user if tokenUser cookie exists
  if (req.cookies && req.cookies.tokenUser) {
    const user = await User.findOne({
      tokenUser: req.cookies.tokenUser,
      deleted: false,
      status: 'active'
    });
    if (user) {
      res.locals.user = user;
    }
  }
  
  // Make flash messages available to all views
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error'),
    warning: req.flash('warning'),
    info: req.flash('info')
  };
  
  next();
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Connect DB once; on Vercel, this will be reused across invocations
// Avoid duplicate connects by calling only here
database.connect();

route(app);
app.use('/admin', routeAdmin);
app.use('/api', apiChatRouter);
app.use('/api/nearby-places', apiNearbyPlacesRouter);

// 404 - không khớp route nào
app.use((req, res) => {
  res.status(404).render('errors/404'); // views/errors/404.ejs
});

// 500 - error handler 4 tham số
app.use((err, req, res, next) => {
  // Multer and payload errors show up here
  if (req.originalUrl && req.originalUrl.startsWith('/admin')) {
    console.error('[ADMIN][ERROR]', err && (err.stack || err.message || err));
  }
  if (res.headersSent) return next(err);
  const isMulter = err && (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE');
  if (isMulter) {
    return res.status(400).render('errors/500', { error: { message: 'Upload ảnh lỗi: ' + (err.message || err.code) } });
  }
  res.status(500).render('errors/500', { error: err });
});

// Export the app for Vercel serverless function
module.exports = app;

// Start local server only when not running in Vercel
if (!process.env.VERCEL) {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

