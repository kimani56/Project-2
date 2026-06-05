const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/booking.js");
const Listing = require("../models/listning.js");
const Coupon = require("../models/coupon.js");
const wrapAsync = require("../utils/wrapAsync.js");

// GET - Booking form for a listing (USERS ONLY, NOT ADMINS)
router.get(
  "/book/:listingId",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to make a booking.");
      return res.redirect("/login");
    }

    if (req.user.isAdmin) {
      req.flash("error", "Admins cannot make bookings.");
      return res.redirect("/listings");
    }

    const listing = await Listing.findById(req.params.listingId);
    const bookings = await Booking.find({
      listing: req.params.listingId,
      status: { $in: ["approved", "pending"] },
    });

    res.render("bookings/form.ejs", { listing, bookings });
  })
);

// POST - Create a booking (USERS ONLY)
router.post(
  "/",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to make a booking.");
      return res.redirect("/login");
    }

    if (req.user.isAdmin) {
      req.flash("error", "Admins cannot make bookings.");
      return res.redirect("/listings");
    }

    const { listingId, checkInDate, checkOutDate, guests, couponCode } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    // Check if dates are available
    const existingBooking = await Booking.findOne({
      listing: listingId,
      status: { $in: ["approved", "pending"] },
      $or: [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) },
        },
      ],
    });

    if (existingBooking) {
      req.flash("error", "These dates are not available.");
      return res.redirect(`/bookings/book/${listingId}`);
    }

    // Calculate total price
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    let totalPrice = nights * listing.price;

    // Validate and apply coupon
    let discountAmount = 0;
    let appliedCoupon = null;
    
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      
      if (!coupon) {
        req.flash("error", "Invalid coupon code.");
        return res.redirect(`/bookings/book/${listingId}`);
      }

      if (!coupon.isActive) {
        req.flash("error", "This coupon is no longer active.");
        return res.redirect(`/bookings/book/${listingId}`);
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        req.flash("error", "This coupon has expired.");
        return res.redirect(`/bookings/book/${listingId}`);
      }

      if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
        req.flash("error", "This coupon has reached its usage limit.");
        return res.redirect(`/bookings/book/${listingId}`);
      }

      discountAmount = (totalPrice * coupon.discountPercent) / 100;
      appliedCoupon = coupon;
    }

    const finalPrice = totalPrice - discountAmount;

    const newBooking = new Booking({
      listing: listingId,
      user: req.user._id,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice,
      discountAmount,
      finalPrice,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      status: "pending",
    });

    await newBooking.save();

    // Increment coupon usage
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $inc: { timesUsed: 1 },
      });
    }

    req.flash("success", "Booking request submitted! Waiting for admin approval.");
    res.redirect("/bookings/my-bookings");
  })
);

// GET - User's bookings (NOT FOR ADMINS)
router.get(
  "/my-bookings",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to view bookings.");
      return res.redirect("/login");
    }

    if (req.user.isAdmin) {
      req.flash("info", "Admins cannot make bookings. View bookings for your listings instead.");
      return res.redirect("/bookings/admin/my-listing-bookings");
    }

    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("bookings/my-bookings.ejs", { bookings });
  })
);

// GET - Admin: View bookings for their listings
router.get(
  "/admin/my-listing-bookings",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can view bookings.");
      return res.redirect("/listings");
    }

    // Get all listings owned by this admin
    const adminListings = await Listing.find({ owner: req.user._id });
    const listingIds = adminListings.map((listing) => listing._id);

    // Get all bookings for these listings
    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate("listing")
      .populate("user")
      .sort({ createdAt: -1 });

    res.render("bookings/admin-listing-bookings.ejs", { bookings, adminListings });
  })
);

// GET - Admin: View all bookings
router.get(
  "/admin/all-bookings",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can view all bookings.");
      return res.redirect("/listings");
    }

    const bookings = await Booking.find()
      .populate("listing")
      .populate("user")
      .sort({ createdAt: -1 });

    res.render("bookings/admin-bookings.ejs", { bookings });
  })
);

// POST - Admin: Approve booking
router.post(
  "/admin/approve/:id",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can approve bookings.");
      return res.redirect("/listings");
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    req.flash("success", "Booking approved!");
    res.redirect("/bookings/admin/all-bookings");
  })
);

// POST - Admin: Reject booking
router.post(
  "/admin/reject/:id",
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can reject bookings.");
      return res.redirect("/listings");
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    req.flash("success", "Booking rejected!");
    res.redirect("/bookings/admin/all-bookings");
  })
);

module.exports = router;
