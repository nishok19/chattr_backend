// importing
import express from "express";
import mongoose from "mongoose";
import RoomsSchema, { messageSchema } from "./SchemaDBrooms.js";
// import Message from "./SchemaMessages.js";
// import Users from "./SchemaDBusers.js";
import Pusher from "pusher";
import cors from "cors";
import morgan from "morgan";

import roomsRouter from "./routes/roomsRouter.js";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1135666",
  key: "ef3c3aa07c44c7f445e9",
  secret: "12458f62175f5d07ac3e",
  cluster: "ap2",
  useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// DB config
const connection_url =
  "mongodb+srv://admin:admin@chatapp.eoenz.mongodb.net/chatappdb?retryWrites=true&w=majority";

mongoose
  .connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    (db) => console.log("connected to the server b****"),
    (err) => console.log("err connecting to the database")
  );

// Pusher

const db = mongoose.connection;

db.once("open", () => {
  console.log("Db is connected");

  // const roomCollection = db.collection("messagecontents"); //.find({} { projection: { data: 1 } })
  const changeStreamRoom = RoomsSchema.watch();

  changeStreamRoom.on("change", (change) => {
    // console.log(change);

    if (change.operationType === "insert") {
      const roomDetails = change.fullDocument;
      pusher.trigger("rooms", "inserted", {
        id: roomDetails._id,
        name: roomDetails.name,
        data: roomDetails.data,
      });
    } else if (change.operationType === "update") {
      const messageDetails = Object.values(
        change.updateDescription.updatedFields
      )[1];
      console.log(change);
      pusher.trigger("rooms", "updated", {
        roomId: change.documentKey,
        data: messageDetails,
      });
    } else {
      console.log("Error triggering Pusher Room");
    }
  });
});

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.use("/rooms", roomsRouter);

// app.get("/messages/sync", (req, res) => {
//   Messages.find((err, data) => {
//     err ? res.status(500).send(err) : res.status(200).send(data);
//   });
// });

// app.post("/messages/new", (req, res) => {
//   const dbMessage = req.body;

//   Messages.create(dbMessage, (err, data) => {
//     err ? res.status(500).send(err) : res.status(201).send(data);
//   });
// });

// app.post("/messages/newroom", (req, res) => {
//   const message = req.body;
//   Messages.updateOne(
//     {
//       name: "testRoom1",
//     },
//     {
//       $push: {
//         data: message,
//       },
//     }
//   );
// });

// listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
