"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username,  firstName, lastName, email, isAdmin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT username,
              password,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
    { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users(
          username,
          password,
          first_name,
          last_name,
          email,
          is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
      [
        username,
        hashedPassword,
        firstName,
        lastName,
        email,
        isAdmin,
      ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, firstName, lastName, email, isAdmin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
      FROM users
      ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, firstName, lastName, email, isAdmin, posts, likedPosts }
   *   where posts is [post_id, ...]
   *   likedPosts is [post_id, ...]
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const likedPostsRes = await db.query(
      `SELECT l.post_id
           FROM likes AS l
           WHERE l.username = $1`, [username]);

    user.likedPosts = likedPostsRes.rows.map(a => a.post_id);

    const postsRes = await db.query(
      `SELECT p.id
           FROM posts AS p
           WHERE p.username = $1`, [username]);

    user.posts = postsRes.rows.map(p => p.id);

    const sentInvitesRes = await db.query(
      `SELECT i.post_id AS "postId", p.username AS "postOwner"
           FROM invites AS i
           INNER JOIN posts AS p
           ON i.post_id = p.id
           WHERE i.username = $1`, [username]);

    user.sentInvites = sentInvitesRes.rows;

    const receivedInvitesRes = await db.query(
      `SELECT i.username, i.post_id AS "postId"
           FROM invites AS i
           WHERE i.post_id IN (
             SELECT p.id
                FROM posts AS p
                WHERE p.username = $1
           )`, [username]);

    user.receivedInvites = receivedInvitesRes.rows;

    return user;
  }


  /** Given a username, return the user's email address.
   *
   * Returns { email }
   *
   * Throws NotFoundError if user not found.
   **/

  static async getEmail(username) {
    const emailRes = await db.query(
      `SELECT email
       FROM users
       WHERE username = $1`,
      [username],
    );

    const email = emailRes.rows[0];

    if (!email) throw new NotFoundError(`No user: ${username}`);

    return email;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** like a post: update db, returns undefined.
   *
   * - username: username liking for post
   * - postId: post id
   **/

  static async likePost(username, postId) {
    const checkPost = await db.query(
      `SELECT id
           FROM posts
           WHERE id = $1`, [postId]);

    if (!checkPost.rows[0]) throw new NotFoundError(`No post: ${postId}`);

    const checkUser = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`, [username]);

    if (!checkUser.rows[0]) throw new NotFoundError(`No username: ${username}`);

    await db.query(
      `INSERT INTO likes (username, post_id)
           VALUES ($1, $2)`,
      [username, postId]);
  }




  /** un-like the post: update db, returns undefined.
   *
   * - username: username un-liking for post
   * - postId: post id
   **/

  static async unlikePost(username, postId) {
    const result = await db.query(
      `DELETE
           FROM likes
           WHERE username = $1 
           AND post_id = $2
           RETURNING username, post_id AS postId`,
      [username, postId],
    );
    if (!result.rows[0]) throw new NotFoundError(`No such like.`);
  }


  /** like a post: update db, returns undefined.
 *
 * - username: username liking for post
 * - postId: post id
 **/

  static async invitePost(username, postId) {
    const checkPost = await db.query(
      `SELECT id
           FROM posts
           WHERE id = $1`, [postId]);

    if (!checkPost.rows[0]) throw new NotFoundError(`No post: ${postId}`);

    const checkUser = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`, [username]);

    if (!checkUser.rows[0]) throw new NotFoundError(`No username: ${username}`);

    await db.query(
      `INSERT INTO invites (username, post_id)
           VALUES ($1, $2)`,
      [username, postId]);
  }




  /** un-like the post: update db, returns undefined.
   *
   * - username: username un-liking for post
   * - postId: post id
   **/

  static async unInvitePost(username, postId) {
    const result = await db.query(
      `DELETE
           FROM invites
           WHERE username = $1 
           AND post_id = $2
           RETURNING username, post_id AS postId`,
      [username, postId],
    );
    if (!result.rows[0]) throw new NotFoundError(`No such invite.`);
  }
}

module.exports = User;
