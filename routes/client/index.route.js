const homeRoutes = require("./home.route");
const attractionRoutes = require("./attraction.route");
const accommodationRoutes = require("./accommodation.route");
const cuisineRoutes = require("./cuisine.route");
const entertainmentRoutes = require("./entertainment.route");
const transportationRoutes = require("./transportation.route");
const blogRoutes = require("./blog.route");
const contactRoutes = require("./contact.route");
const authRoutes = require("./auth.route");
const reviewRoutes = require("./review.route");

module.exports = (app) => {
  app.use("/", homeRoutes);
  app.use("/attraction", attractionRoutes);
  app.use("/accommodation", accommodationRoutes);
  app.use("/cuisine", cuisineRoutes);
  app.use("/entertainment", entertainmentRoutes);
  app.use("/transportation", transportationRoutes);
  app.use("/blog", blogRoutes);
  app.use("/contact", contactRoutes);
  app.use("/auth", authRoutes);
  app.use("/api/reviews", reviewRoutes);
};
