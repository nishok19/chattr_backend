// importing
import express from "express";
import mongoose from "mongoose";
import RoomsSchema, { messageSchema } from "./SchemaDBrooms.js";
import Pusher from "pusher";
import cors from "cors";
import morgan from "morgan";
import User from "./SchemaDBusers.js";
// import cookieParser from "cookie-parser";

import roomsRouter from "./routes/roomsRouter.js";
import { loginRouter, singupRouter } from "./routes/loginRouter.js";

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

// app.use(auth);
// app.use(cookieParser)

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

  const changeStreamRoom = RoomsSchema.watch();

  changeStreamRoom.on("change", (change) => {
    if (change.operationType === "insert") {
      const { _id, name, data, users } = change.fullDocument;
      pusher.trigger("rooms", "inserted", {
        users,
        _id,
        name,
        data,
      });
    } else if (change.operationType === "update") {
      // const messageDetails = Object.values(
      //   change.updateDescription.updatedFields
      // )[1];
      const messageDetails = change.updateDescription.updatedFields;
      //
      const updateType = Object.keys(messageDetails)
        .map((key) => {
          if (key.indexOf(".") >= 0) return key;
        })
        .filter((k) => k != undefined)
        .map((el) => el.split(".")[0])[0];

      const exsumptionType = Object.keys(messageDetails)
        .map((key) => {
          if (key === "data") return key;
        })
        .filter((k) => k != undefined)[0];
      // console.log("exsumption", exsumptionType);
      //
      if (updateType === "data" || exsumptionType === "data") {
        pusher.trigger("rooms", "updated", {
          roomId: change.documentKey,
          // data: messageDetails,
          data: messageDetails,
          type: "messageUpdate",
        });
      } else if (updateType === "users") {
        User.find({ email: Object.values(messageDetails)[0] }).then(
          (user) => {
            const userDetails = user.map(({ _id, name, photoURL, email }) => ({
              _id,
              name,
              photoURL,
              email,
            }));
            pusher.trigger("rooms", "updated", {
              roomId: change.documentKey,
              user: messageDetails,
              userDetails: userDetails,
              type: "userUpdate",
            });
          },
          (err) => res.send(err)
        );
      }

      console.log(messageDetails);
    } else {
      console.log("Error triggering Pusher Room");
    }
  });
});

// checking for JWT

// const auth = (req, res, next) => {
//   console.log(req.headers);
//   if (!req.headers.user) {
//     res.status(401).send("not authenticated");
//   } else if (req.headers.user) {
//     next();
//   } else {
//     res.status(401).send("error signing in");
//   }
// };

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));
app.use("/auth", loginRouter, singupRouter);
app.use("/rooms", roomsRouter);

// listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
