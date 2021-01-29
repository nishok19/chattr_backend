import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  rooms: [],
  password: String,
  photoURL: String,
  provider: {
    providerId: String,
    uid: String,
  },
});

export default mongoose.model("users", userSchema);
