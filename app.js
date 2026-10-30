const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path");

require("./config/passport");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "development-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24
  }
};

if (process.env.MONGODB_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions"
  });
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("index", { title: "Express + Mongoose" });
});

app.use("/", authRoutes);
app.use("/users", userRoutes);

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Сторінку не знайдено",
    message: "Запитаний маршрут не існує."
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render("error", {
    title: "Помилка сервера",
    message: process.env.NODE_ENV === "production"
      ? "Сталася внутрішня помилка сервера."
      : err.message
  });
});

module.exports = app;
