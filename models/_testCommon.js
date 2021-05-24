const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testPostIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM posts");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM likes");
  await db.query("DELETE FROM invites");
  await db.query("DELETE FROM comments");

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);


  const resultsPosts = await db.query(`
    INSERT INTO posts(item_name, username, city, category, age_group)
    VALUES ('item1', 'u1', 'city1', 'toy', 'baby'),
           ('item2', 'u2', 'city2', 'book', 'kid')
    RETURNING id`);
  testPostIds.splice(0, 0, ...resultsPosts.rows.map(r => r.id));


  await db.query(`
    INSERT INTO likes(username, post_id)
    VALUES ('u2', $1)`,
    [testPostIds[0]]);


  await db.query(`
    INSERT INTO invites(username, post_id)
    VALUES ('u2', $1)`,
    [testPostIds[0]]);

    
  await db.query(`
    INSERT INTO comments(username, text, post_id)
    VALUES ('u2', 'good', $1)`,
    [testPostIds[0]]); 

}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPostIds,
};