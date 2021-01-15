import mongoose from "mongoose";

export const messageSchema = mongoose.Schema({
  message: String,
  name: String,
  timestamp: String,
});

const chatappSchema = new mongoose.Schema({
  name: String,
  data: [messageSchema],
  users: [],
});

export default mongoose.model("messagecontents", chatappSchema);
// export default mongoose.model("Message", messageSchema);
