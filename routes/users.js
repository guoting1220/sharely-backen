"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUser, ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email, isAdmin }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user: { username, firstName, lastName, isAdmin, email, posts, likedPosts} }
 *
 *   where posts is [post_id, ... ] 
 *         likedPosts is [post_id, ... ]
 *
 * Authorization required: none
 **/

router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { email }
 *
 *
 * Authorization required: logged in user
 **/

router.get("/:username/email", ensureLoggedIn, async function (req, res, next) {
  try {
    const { email } = await User.getEmail(req.params.username);
    return res.json({ email });
  } catch (err) {
    return next(err);
  }
});

/** POST /[username, postId]  =>  { liked: postId }
 *
 * Authorization required: same-user-as-:username
 **/

router.post("/:username/like/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const postId = +req.params.id;
    await User.likePost(req.params.username, postId);
    return res.json({ liked: postId });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username, postId]  =>  { unliked: postId }
 *
 * Authorization required: same-user-as-:username
 **/

router.delete("/:username/like/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const postId = +req.params.id;
    await User.unlikePost(req.params.username, postId);
    return res.json({ unliked: postId });
  } catch (err) {
    return next(err);
  }
});



/** POST /[username, postId]  =>  { invite: postId }
 *
 * Authorization required: same-user-as-:username
 **/

router.post("/:username/invite/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const postId = +req.params.id;
    await User.invitePost(req.params.username, postId);
    return res.json({ invite: postId });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username, postId]  =>  { uninvite: postId }
 *
 * Authorization required: same-user-as-:username
 **/

router.delete("/:username/invite/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const postId = +req.params.id;
    await User.unInvitePost(req.params.username, postId);
    return res.json({ uninvite: postId });
  } catch (err) {
    return next(err);
  }
});



module.exports = router;
