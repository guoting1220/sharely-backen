"use strict";

/** Routes for posts. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { ensureLoggedIn, ensureCorrectUserOrAdmin, ensureAdmin, ensureCorrectUser } = require("../middleware/auth");
const Post = require("../models/post");
const postNewSchema = require("../schemas/postNew.json");
const postUpdateSchema = require("../schemas/postUpdate.json");
const postSearchSchema = require("../schemas/postSearch.json"); 
const commentNewSchema = require("../schemas/commentNew.json");


const router = express.Router({ mergeParams: true });

/** GET / =>
 *   { posts: [ { id, itemName, username, postDate, city,
 *                imgUrl, category, ageGroup }, ...] }
 *
 * Can provide search filter in query:
 * - itemName
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.query, postSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const posts = await Post.findAll(req.query);
    return res.json({ posts });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] => { post }
 *
* post includes { id, itemName, username, postDate, city, imgUrl,
*           description, category, ageGroup, invitesSentOut, invitesReceived }
*   where invitesSentOut is [postId, ...]
*         invitesReceived is [postId, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const post = await Post.get(req.params.id);
    return res.json({ post });
  } catch (err) {
    return next(err);
  }
});


/** POST / { data } => { post }
 *
  * data should be { itemName, username, postDate, city,
  *                  imgUrl, description, category, ageGroup }
  *
  * post should be { id, itemName, username, postDate, city,
  *                  imgUrl, description, category, ageGroup }
 *
 * Authorization required: logged in user
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {       
    const validator = jsonschema.validate(req.body, postNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const post = await Post.create({ 
      ...req.body, 
      username: res.locals.user.username
    });
    
    return res.status(201).json({ post });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id]  { data } => { post }
 *
 * data can include: { itemName, city, imgUrl,
   *                   description, category, ageGroup }
 *
 * post includes { id, itemName, username, postDate, city, imgUrl,
 *                description, category, ageGroup }
 *
 * Authorization required: logged in user
 */

router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const post = await Post.get(req.params.id);
    if (post && post.username !== res.locals.user.username) {
      throw new UnauthorizedError();
    }
    const validator = jsonschema.validate(req.body, postUpdateSchema);

    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const updatedPost = await Post.update(req.params.id, req.body);
    return res.json({ updatedPost });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization required: logged in user
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const post = await Post.get(req.params.id);
    if (post && post.username !== res.locals.user.username) {
      throw new UnauthorizedError();
    }
    await Post.remove(req.params.id);
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});

/** POST / { data } => { comment }
 *
  * data should be { username, postId, text }
  *
  * comment should be { id, username, postId, text, commentDate }
 *
 * Authorization required: logged in user
 */

router.post("/:post_id/comments", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, commentNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const comment = await Post.addComment({ 
      ...req.body, 
      username: res.locals.user.username, 
      postId: req.params.post_id
    });
    return res.status(201).json({ comment });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deletedComent: id }
 *
 * Authorization required: logged in user
 */

router.delete("/:post_id/comments/:comment_id", ensureLoggedIn, async function (req, res, next) {
  try {
    const comment = await Post.getComment(req.params.comment_id);
    if (comment && comment.username !== res.locals.user.username) {
      throw new UnauthorizedError();
    }
    await Post.removeComment(req.params.comment_id);
    return res.json({ deletedComent: +req.params.comment_id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
