import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../SchemaDBusers.js";

dotenv.config();

const loginRouter = express.Router();

loginRouter.use(express.json());

loginRouter
  .route("/login")
  .get((req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const userEmail = user.email;
      User.findOne({ email: userEmail }).then(
        (user) => {
          if (user) {
            // if (user.provider.uid == req.body.uid) {
            // The proper user data is sendt only when UID is correct
            res.json({
              user: {
                email: user.email,
                name: user.name,
                rooms: user.rooms,
                _id: user._id,
                photoURL: user?.photoURL,
              },
              userExists: true,
            });
            // } else {
            //   res.send("something wrong with the uid");
            // }
          } else {
            res.json({ userExists: false });
          }
        },
        (err) => res.send(err)
      );
    });
  })
  .post((req, res, next) => {
    const userEmail = req.body.email;
    if (req.body.loginType == "google") {
      User.findOne({ email: userEmail }).then(
        (user) => {
          if (user) {
            if (user.provider.uid == req.body.uid) {
              // The proper user data is sendt only when UID is correct
              const userObj = { email: userEmail };
              const accessToken = jwt.sign(
                userObj,
                process.env.ACCESS_TOKEN_SECRET
              );
              res.json({ accessToken, user, userExists: true });
            } else {
              res.send("something wrong with the uid");
            }
          } else {
            res.json({ userExists: false });
          }
        },
        (err) => res.send(err)
      );
    } else if (req.body.loginType == "emailandpassword") {
      User.findOne({ email: userEmail }).then(
        (user) => {
          if (user) {
            if (user.password == req.body.password) {
              // The proper user data is sendt only when PASSWORD is correct
              const userObj = { email: userEmail };
              const accessToken = jwt.sign(
                userObj,
                process.env.ACCESS_TOKEN_SECRET
              );
              res.json({ accessToken, user, userExists: true });
            } else {
              res.send("something wrong with the password");
            }
          } else {
            res.json({ userExists: false });
          }
        },
        (err) => res.send(err)
      );
    }

    // const user = { user: userEmail };

    // const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    // res.json({ accessToken, user });
  });

const singupRouter = express.Router();

singupRouter.use(express.json());

singupRouter
  .route("/signup")
  .get((req, res, next) => {
    res.send("signup not support with GET");
  })
  .post((req, res, next) => {
    const email = req.body.email;

    // Find the whether the user already Exists ???
    User.findOne({ email }).then(
      (user) => {
        if (user == null) {
          // creating new user
          User.create(req.body).then((user) => {
            res.json({ user, userExists: false });
          });
        } else {
          res.json({ userExists: true });
        }
      },
      (err) => res.send("err creating user", err)
    );
  })
  .delete((req, res, next) => {
    const email = req.body.email;
    User.deleteOne({ email }).then((user) => {
      res.json("deleted successfully");
    });
  });

export { loginRouter, singupRouter };
