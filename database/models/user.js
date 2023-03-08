// load mongoose since we need it to define a model
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
userSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  is_bot: Boolean,
  first_name: String,
  username: String,
  language_code: String,
  limit: Object,
});
module.exports = mongoose.model("User", userSchema);
