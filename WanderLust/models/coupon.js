const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  maxUses: {
    type: Number,
    default: null, // null = unlimited
  },
  timesUsed: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
    default: null, // null = no expiry
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
