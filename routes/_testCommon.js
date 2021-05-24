"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Post = require("../models/post");
const { createToken } = require("../helpers/tokens");

const testPostIds = [];
const testCommentIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM posts");

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "u1@user.com",
    password: "password1",
    isAdmin: false,
  });

  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "u2@user.com",
    password: "password2",
    isAdmin: false,
  });

  testPostIds[0] = (await Post.create(
    {
      itemName: "item1",
      username: "u1",
      city: "city1",
      category: "toy",
      ageGroup: "baby",
    })).id;

  testPostIds[1] = (await Post.create(
    {
      itemName: "item2",
      username: "u2",
      city: "city2",
      category: "book",
      ageGroup: "kid",
    })).id;


  await User.likePost("u2", testPostIds[0]);

  await User.invitePost("u1", testPostIds[1]);

  testCommentIds[0] = (await Post.addComment({username:"u1", postId:testPostIds[1], text:"good"})).id;

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


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPostIds,
  testCommentIds,
  u1Token,
  u2Token,
  adminToken,
};
