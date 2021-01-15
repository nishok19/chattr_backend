import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  rooms: [],
});

export default mongoose.model("users", userSchema);
