const express = require("express");
const router = express.Router();
const Listing = require("../models/listning.js");
const Booking = require("../models/booking.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.get(
  "/",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find();
    res.render("listings/index.ejs", { allListings });
  })
);

// GET - Filter by category
router.get(
  "/category/:categoryName",
  wrapAsync(async (req, res) => {
    const categoryName = req.params.categoryName;
    const categoryListings = await Listing.find({ category: categoryName });
    res.render("listings/index.ejs", { allListings: categoryListings, selectedCategory: categoryName });
  })
);

// Creating a new listing - ADMIN ONLY
router.get("/newlist", (req, res) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    res.render("listings/form.ejs");
  } else if (!req.isAuthenticated()) {
    req.flash("error", "You need to be logged in to create a listing.");
    res.redirect("/login");
  } else {
    req.flash("error", "Only admins can create listings.");
    res.redirect("/listings");
  }
});

// Posting the new listing to the database - ADMIN ONLY
router.post(
  "/",
  upload.array("images", 4),
  wrapAsync(async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      req.flash("error", "Only admins can create listings.");
      return res.redirect("/listings");
    }

    const { title, description, location, country, price, category } = req.body;

    // Handle multiple images
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      filename: file.filename,
    })) : [];

    // Set main image as first image or fallback
    const mainImage = images.length > 0 ? images[0] : (req.file ? { url: req.file.path, filename: req.file.filename } : null);

    const newListing = new Listing({
      title,
      description,
      images: images.length > 0 ? images : (req.file ? [{ url: req.file.path, filename: req.file.filename }] : []),
      image: mainImage,
      location,
      country,
      price,
      category,
      owner: req.user._id,
    });

    await newListing.save();

    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
  })
);

// Edit Form Rendering
router.get(
  "/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to edit a listing.");
      return res.redirect("/login");
    }
    // Check if the user is the owner of the listing
    if (listing.owner && listing.owner.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to edit this listing.");
      return res.redirect(`/listings/${id}`);
    }
    res.render("listings/editfrom.ejs", { listing });
  })
);

// Updating the listing
router.put(
  "/:id",
  upload.array("images", 4),
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, price, location, country, category } = req.body;

    const listing = await Listing.findById(id);

    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to update a listing.");
      return res.redirect("/login");
    }

    // Check if the user is the owner of the listing
    if (listing.owner && listing.owner.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to update this listing.");
      return res.redirect(`/listings/${id}`);
    }

    listing.title = title;
    listing.description = description;
    listing.price = price;
    listing.location = location;
    listing.country = country;
    listing.category = category;

    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      listing.images = req.files.map(file => ({
        url: file.path,
        filename: file.filename,
      }));
      listing.image = {
        url: req.files[0].path,
        filename: req.files[0].filename,
      };
    } else if (req.file) {
      // Fallback for single file upload
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save();

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${listing._id}`);
  })
);

// Deleting Form
router.get(
  "/:id/delete",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to delete a listing.");
      return res.redirect("/login");
    }
    // Check if the user is the owner of the listing
    if (listing.owner && listing.owner.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to delete this listing.");
      return res.redirect(`/listings/${id}`);
    }
    res.render("listings/deleteform.ejs", { listing });
  })
);

// Listing the Particular List in show.ejs from index.ejs
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { id, listing });
  })
);

// Deleting the listing
router.post(
  "/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!req.isAuthenticated()) {
      req.flash("error", "You need to be logged in to delete a listing.");
      return res.redirect("/login");
    }

    // Check if the user is the owner of the listing
    if (listing.owner && listing.owner.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to delete this listing.");
      return res.redirect(`/listings/${id}`);
    }

    // Delete associated bookings and reviews
    await Booking.deleteMany({ listing: id });
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    
    await Listing.findByIdAndDelete(id);
    req.flash("success", `Listing deleted successfully!`);
    res.redirect("/listings");
  })
);
module.exports = router;
