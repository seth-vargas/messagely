const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user. */

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const message = await Message.get(req.params.id);
    return res.json(message);
  } catch (error) {
    return next(error);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const { from_username } = req.body.token;
    const message = Message.create(
      from_username,
      req.body.to_username,
      req.body.body
    );
  } catch (error) {
    return next(error);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
  try {
    const user = req.user
    const message = await Message.get(req.params.id)

    // check message is intended for logged in user

  } catch (error) {
    return next(error);
  }
});

module.exports = router;
