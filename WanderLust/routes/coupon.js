const express = require("express");
const router = express.Router();
const Coupon = require("../models/coupon.js");
const wrapAsync = require("../utils/wrapAsync.js");

// GET - Admin: View all coupons
router.get(
  "/admin/all-coupons",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can manage coupons.");
      return res.redirect("/listings");
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render("coupons/admin-coupons.ejs", { coupons });
  })
);

// GET - Admin: Create coupon form
router.get(
  "/admin/create-coupon",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can create coupons.");
      return res.redirect("/listings");
    }

    res.render("coupons/create-coupon.ejs");
  })
);

// POST - Admin: Create coupon
router.post(
  "/admin/create-coupon",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can create coupons.");
      return res.redirect("/listings");
    }

    const { code, discountPercent, maxUses, expiryDate } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      req.flash("error", "This coupon code already exists.");
      return res.redirect("/coupons/admin/create-coupon");
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountPercent,
      maxUses: maxUses || null,
      expiryDate: expiryDate || null,
      isActive: true,
    });

    await newCoupon.save();
    req.flash("success", `Coupon ${code.toUpperCase()} created successfully!`);
    res.redirect("/coupons/admin/all-coupons");
  })
);

// POST - Admin: Toggle coupon status
router.post(
  "/admin/toggle/:id",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can manage coupons.");
      return res.redirect("/listings");
    }

    const coupon = await Coupon.findById(req.params.id);
    coupon.isActive = !coupon.isActive;
    await coupon.save();

    req.flash("success", `Coupon ${coupon.code} ${coupon.isActive ? "activated" : "deactivated"}!`);
    res.redirect("/coupons/admin/all-coupons");
  })
);

// POST - Admin: Delete coupon
router.post(
  "/admin/delete/:id",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can manage coupons.");
      return res.redirect("/listings");
    }

    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    req.flash("success", `Coupon ${coupon.code} deleted!`);
    res.redirect("/coupons/admin/all-coupons");
  })
);

module.exports = router;
