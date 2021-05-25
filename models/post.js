"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Post {
  /** Create a post (from data), update db, return new post data.
   *
   * data should be { itemName, username, postDate, city, 
   *                  imgUrl, description, category, ageGroup }
   *
   * Returns { id, itemName, username, postDate, city,
   *           imgUrl, description, category, ageGroup }
   **/

  static async create(data) {
    const result = await db.query(
      `INSERT INTO posts (item_name,
                          username,
                          city,
                          img_url,
                          description,
                          category,
                          age_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, 
                 item_name AS "itemName",
                 username,
                 TO_CHAR(post_date, 'YYYY-MM-DD HH24:MI') AS "postDate",
                 city,
                 img_url AS "imgUrl",
                 description,
                 category,
                 age_group AS "ageGroup"`,
      [
        data.itemName,
        data.username,
        data.city,
        data.imgUrl,
        data.description,
        data.category,
        data.ageGroup
      ]);

    return result.rows[0];
  }

  /** Find all posts (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - itemName
   *
   * Returns [{ id, itemName, username, postDate, city,
   *            imgUrl, category, ageGroup }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id,
                        item_name AS "itemName",
                        username,
                        TO_CHAR(post_date, 'YYYY-MM-DD HH24:MI') AS "postDate",
                        city,
                        img_url AS "imgUrl",                   
                        category,
                        age_group AS "ageGroup"
                 FROM posts`;
    let whereExpressions = [];
    let queryValues = [];

    const { itemName } = searchFilters;

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (itemName !== undefined) {
      queryValues.push(`%${itemName}%`);
      whereExpressions.push(`item_name ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }
    // Finalize query and return results

    query += " ORDER BY post_date DESC";
    const postsRes = await db.query(query, queryValues);

    return postsRes.rows;
  }

  /** Given a post id, return data about post.
   *
   * Returns { id, itemName, username, postDate, city, imgUrl,
   *           description, category, ageGroup, sentInvites, receivedInvites }
   *   where sentInvites is [postId, ...]
   *         receivedInvites is [postId, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const postRes = await db.query(
      `SELECT id,
              item_name AS "itemName",
              username,
              TO_CHAR(post_date, 'YYYY-MM-DD HH24:MI') AS "postDate",
              city,
              img_url AS "imgUrl",
              description,
              category,
              age_group AS "ageGroup"
       FROM posts
       WHERE id = $1`, [id]);

    const post = postRes.rows[0];

    if (!post) throw new NotFoundError(`No post: ${id}`);

    const commentsRes = await db.query(
      `SELECT id,
              username,
              text,
              post_id AS "postId",
              TO_CHAR(comment_date, 'YYYY-MM-DD HH24:MI') AS "commentDate"
       FROM comments
       WHERE post_id = $1
       ORDER BY comment_date DESC`, [id]);

    post.comments = commentsRes.rows;

    return post;
  }

  /** Update post data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { itemName, city, imgUrl,
   *                     description, category, ageGroup }
   *
   * Returns { id, itemName, username, postDate, city, imgUrl,
   *           description, category, ageGroup }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        itemName: "item_name",
        imgUrl: "img_url",
        ageGroup: "age_group",
      });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE posts 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                item_name AS "itemName",
                                username,
                                TO_CHAR(post_date, 'YYYY-MM-DD HH24:MI') AS "postDate",
                                city,
                                img_url AS "imgUrl",
                                description,
                                category,
                                age_group AS "ageGroup"`;

    const result = await db.query(querySql, [...values, id]);
    const post = result.rows[0];

    if (!post) throw new NotFoundError(`No post: ${id}`);

    return post;
  }

  /** Delete given post from database; returns undefined.
   *
   * Throws NotFoundError if post not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
        FROM posts
        WHERE id = $1
        RETURNING id`, [id]);
    const post = result.rows[0];

    if (!post) throw new NotFoundError(`No post: ${id}`);
  }


  /** Given a comment id, return data about comment.
  *
  * Returns { id, username, postId, text, commentDate }
  *  
  * Throws NotFoundError if not found.
  **/

  static async getComment(id) {
    const commentRes = await db.query(
      `SELECT id,
              username,
              text,
              post_id AS "postId",
              TO_CHAR(comment_date, 'YYYY-MM-DD HH24:MI') AS "commentDate"
       FROM comments
       WHERE id = $1`, [id]);

    const comment = commentRes.rows[0];

    if (!comment) throw new NotFoundError(`No comment: ${id}`);

    return comment;
  }


  /** Create a comment (from data), update db, return new comment data.
   *
   * data should be { username, postId, text }
   *
   * Returns { id, username, postId, text, commentDate }
   **/

  static async addComment(data) {
    const result = await db.query(
      `INSERT INTO comments ( username,
                              post_id,
                              text)
       VALUES ($1, $2, $3)
       RETURNING id, 
                 username,
                 text,
                 post_id AS "postId",
                 TO_CHAR(comment_date, 'YYYY-MM-DD HH24:MI') AS "commentDate"`,
      [
      data.username,
      data.postId,
      data.text
      ]
    );

    return result.rows[0];
  }

  /** Delete given comment from database; returns undefined.
 *
 * Throws NotFoundError if comment not found.
 **/

  static async removeComment(id) {
    const result = await db.query(
      `DELETE
        FROM comments
        WHERE id = $1
        RETURNING id`, [id]);

    const comment = result.rows[0];

    if (!comment) throw new NotFoundError(`No comment: ${id}`);
  }
}

module.exports = Post;
