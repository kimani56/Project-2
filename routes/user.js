const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const Listing = require("../models/listning");
const Review = require("../models/review");

router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

router.post(
  "/signup",
  wrapAsync(async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({
        email: email,
        username: username,
      });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, (err) => {  
        if (err) {
          console.error("Login error after registration:", err);
          req.flash("error", "Login failed. Please try again.");
          return res.redirect("/signup");
        }
        console.log("User registered successfully:", registeredUser); // for debugging
        req.flash("success", "Welcome to Urban Haven Housing, Signup Done 🥳 ");
        res.redirect("/");
      });
    } catch (e) {
      console.log("Signup error:", e.message); // for debugging

      if (e.name === "UserExistsError") {
        req.flash("error", "Username already exists. Please log in.");
        return res.redirect("/login");
      }

      req.flash("error", "Signup failed. Please try again.");
      res.redirect("/signup");
    }
  })
);

router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "welcome Back !!");
    res.redirect("/");
  }
);

router.get("/logout", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.flash("success", "You are already logged out.");
    return res.redirect("/");
  }

  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      req.flash("error", "Logout failed. Please try again.");
      return res.redirect("/");
    }
    req.flash("success", "Logged out successfully!");
    res.redirect("/");
  });
});

router.get("/profile", (req, res) => {
  if (req.isAuthenticated() == true) {
    let username = req.user.username;
    let email = req.user.email;
    console.log(req.user);
    res.render("users/profile.ejs", { username, email });
  } else {
    req.flash("error", "You need to be logged in to view your profile.");
    res.redirect("/login");
  }
});

router.get("/report", 
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to view your report.");
      return res.redirect("/login");
    }

    const userId = req.user._id;

    // Get user's listings
    const userListings = await Listing.find({ owner: userId }).populate("reviews");

    // Get user's reviews
    const userReviews = await Review.find({ author: userId }).sort({ createdAt: -1 });

    // Calculate statistics
    const totalListings = userListings.length;
    const totalReviews = userReviews.length;
    const averageRating = totalReviews > 0 
      ? userReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    const lastReviewDate = userReviews.length > 0 ? userReviews[0].createdAt : null;
    const recentReviews = userReviews.slice(0, 10); // Last 10 reviews

    const reportData = {
      totalListings,
      totalReviews,
      averageRating,
      lastReviewDate,
      recentReviews,
      userListings,
    };

    res.render("users/report.ejs", { reportData });
  })
);

// Forgot Password Route
router.post(
  "/forgot-password",
  wrapAsync(async (req, res) => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ 
          message: "No account found with that email address" 
        });
      }

      // TODO: Implement email sending with nodemailer
      // For now, return a success message
      // In production, you would:
      // 1. Generate a reset token
      // 2. Save it to the database with expiry
      // 3. Send email with reset link
      // 4. User clicks link and resets password
      
      return res.status(200).json({ 
        message: "Password reset link has been sent to your email (Feature in development)" 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        message: "An error occurred. Please try again later." 
      });
    }
  })
);

module.exports = router;
