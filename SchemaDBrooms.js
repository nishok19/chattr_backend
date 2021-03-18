import mongoose from "mongoose";

export const messageSchema = mongoose.Schema(
  {
    message: String,
    user: String,
  },
  {
    timestamps: true,
  }
);

const chatappSchema = new mongoose.Schema({
  name: String,
  data: [messageSchema],
  users: [],
});

export default mongoose.model("messagecontents", chatappSchema);
