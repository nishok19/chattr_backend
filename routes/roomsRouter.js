import express from "express";
import Messages from "../SchemaDBrooms.js";

const roomsRouter = express.Router();

roomsRouter.use(express.json());

roomsRouter
  .route("/")
  .get((req, res, next) => {
    Messages.find({}).then(
      (data) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(data);
      },
      (err) => res.status(500).send(err)
    );
  })
  .post((req, res, next) => {
    const dbMessage = req.body;
    res.statusCode = 201;
    res.setHeader("Content-Type", "application/json");
    Messages.create(dbMessage, (err, data) => {
      err ? res.status(500).send(err) : res.status(201).send(data);
    });
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
  .post((req, res, next) =>
    res.send("Put opeeation not yet supported in /rooms/:roomId")
  )
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
