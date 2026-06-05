const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongooose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.plugin(passportLocalMongooose);

module.exports = mongoose.model("User", userSchema);
