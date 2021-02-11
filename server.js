// importing
import express from "express";
import mongoose from "mongoose";
import RoomsSchema, { messageSchema } from "./SchemaDBrooms.js";
import Pusher from "pusher";
import cors from "cors";
import morgan from "morgan";
import Users from "./SchemaDBusers.js";
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
  const changeStreamUser = Users.watch();

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
          if (key === "data" || key === "users") return key;
        })
        .filter((k) => k != undefined)[0];
      console.log("rooms pusher", updateType, exsumptionType);

      if (updateType === "data" || exsumptionType === "data") {
        pusher.trigger("rooms", "updated", {
          roomId: change.documentKey,
          // data: messageDetails,
          data: messageDetails,
          type: "messageUpdate",
        });
      } else if (updateType === "users" || exsumptionType === "users") {
        // object.values(msgDetails)[0] return true if the user is deleted and returns false if user is added
        const isUserDeleted = Array.isArray(Object.values(messageDetails)[0]);
        console.log("user deleted", isUserDeleted);
        if (isUserDeleted) {
          pusher.trigger("rooms", "updated", {
            roomId: change.documentKey,
            usersRemain: Object.values(messageDetails)[0],
            type: "userDelete",
          });
        } else {
          Users.find({ email: Object.values(messageDetails)[0] }).then(
            (user) => {
              const userDetails = user.map(
                ({ _id, name, photoURL, email }) => ({
                  _id,
                  name,
                  photoURL,
                  email,
                })
              );
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
      }
    } else if (change.operationType === "delete") {
      console.log("operation type...", change);
      pusher.trigger("rooms", "deleted", {
        roomId: change.documentKey,
      });
    } else {
      console.log("error triggering pusher...", change);
    }
  });

  // changeStreamUser.on("change", (change) => {
  //   console.log("user pusher", change);
  //   if (change.operationType === "update") {
  //     const user = change.updateDescription.updatedFields;
  //     const updateType = Object.keys(user)
  //       .map((key) => {
  //         if (key.indexOf(".") >= 0) return key;
  //       })
  //       .filter((k) => k != undefined)
  //       .map((el) => el.split(".")[0])[0];

  //     if (updateType === "users") {
  //       pusher.trigger("users", "updated", {
  //         roomId: change.documentKey,
  //         data: user,
  //         //  type: "messageUpdate",
  //       });
  //     }
  //   }
  // });
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
