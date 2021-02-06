import express from "express";
import Messages from "../SchemaDBrooms.js";
import Users from "../SchemaDBusers.js";
import jwt from "jsonwebtoken";

const roomsRouter = express.Router();

roomsRouter.use(express.json());

roomsRouter
  .route("/")
  .get((req, res, next) => {
    // start of testing jwt
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    var jwtUser = null;
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      // res.send(user);
      jwtUser = user.email;
      // next();

      // end of testing jwt
      Users.findOne({ email: jwtUser }).then(
        (user) => {
          if (!user) return res.status(404).json({ isUserFound: "false" });
          var userRooms = user.rooms;
          // console.log("theuser", userRooms);
          Messages.find({
            name: {
              $in: userRooms,
            },
          }).then(
            (data) => {
              const people = data.map((room) => room.users);
              const allPeople = [...new Set(people.flat(1))];
              Users.find({
                email: {
                  $in: allPeople,
                },
              }).then(
                (people) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  const peoples = people.map(
                    ({ _id, name, photoURL, email }) => ({
                      _id,
                      name,
                      photoURL,
                      email,
                    })
                  );
                  res.json({
                    peoples,
                    data,
                  });
                  // res.json(allPeople);
                  // res.json(data);
                },
                (err) => res.send(err)
              );
            },
            (err) => res.status(500).send(err)
          );
        },
        (err) => res.status(500).send(err)
      );
    });
  })
  .post((req, res, next) => {
    const newRoom = req.body;
    // const users = req.body.users;
    // res.statusCode = 201;
    // res.setHeader("Content-Type", "application/json");
    // console.log("room inserted", newRoom);
    Messages.create(newRoom).then(
      (dataRoom) => {
        // res.statusCode = 201;
        // res.send(dataRoom);
        //
        Users.find({
          email: {
            $in: dataRoom.users,
          },
        }).then(
          (users) => {
            users.map((user) => {
              Users.findOneAndUpdate(
                { email: user.email },
                // { $set: { rooms:  } },
                { $push: { rooms: dataRoom.name } },
                { new: true, useFindAndModify: false },
                (err, doc) => {
                  if (err) res.status(404).send(err);
                }
              );
            });
          },
          (err) => res.status(500).send(err)
        );
        res.json(dataRoom);
      },
      (err) => res.status(500).send(err)
    );
  })
  .put((req, res, next) => {
    res.send("for /rooms PUT is not yet supported");
  })
  .delete((req, res, next) => {
    res.send("for /rooms DELETE is not yet supported");
  });

roomsRouter
  .route("/:roomId")
  .get((req, res, next) => {
    Messages.findById(req.params.roomId).then(
      (room) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(room.name);
      },
      (err) => res.status(500).send(err)
    );
    Messages.findById(req.params.roomId, (err, data) => {
      err ? res.status(500).send(err) : res.status(200).send(data);
    });
  })
  .post((req, res, next) => {
    // res.send("Put opeeation not yet supported in /rooms/:roomId")

    // User.findOne({ email: req.body.user }).then(
    //   (user) => {
    //     if (user) {
    //       // if (user) {

    //         res.json({ accessToken, user, userExists: true });
    //       // } else {
    //       //   res.send("something wrong with the uid");
    //       // }
    //     } else {
    //       res.json({ userExists: false });
    //     }
    //   },
    //   (err) => res.send(err)
    // );

    Users.findOneAndUpdate(
      { email: req.body.user },
      // { $set: { rooms:  } },
      { $push: { rooms: req.body.room } },
      { new: true, useFindAndModify: false },
      (err, doc) => {
        if (err) res.status(404).send(err);
        Messages.findByIdAndUpdate(
          req.params.roomId,
          // { $set: { rooms:  } },
          { $push: { users: req.body.user } },
          { new: true, useFindAndModify: false },
          (err, doc) => {
            if (err) res.status(404).send(err);
          }
        );
      }
    );
  })
  .put((req, res, next) => {
    Messages.findById(req.params.roomId).then((room) => {
      if (room) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        room.data.push(req.body);
        room.save().then((room) => {
          res.json(room);
        });
      } else {
        res.status(404).send("Room not found");
      }
    });
  });

// .delete();

export default roomsRouter;
