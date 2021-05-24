"use strict";

const request = require("supertest");

// const db = require("../db.js");
const app = require("../app");
// const Post = require("../models/post");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPostIds,
  testCommentIds,
  u1Token,
  u2Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /posts */

describe("GET /posts", function () {
  test("works for all users", async function () {

    const resp = await request(app)
      .get("/posts");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      posts: [
        {
          id: testPostIds[1],
          itemName: "item2",
          username: "u2",
          city: "city2",
          category: "book",
          ageGroup: "kid",
          postDate: expect.any(String),
          imgUrl: null
        },
        {
          id: testPostIds[0],
          itemName: "item1",
          username: "u1",
          city: "city1",
          category: "toy",
          ageGroup: "baby",
          postDate: expect.any(String),
          imgUrl: null
        }
      ]
    });
  });
});

/************************************** POST /posts */

describe("POST /posts", function () {
  let newPost = {
    itemName: "testItem",
    username: "u1",
    city: "testCity",
    category: "book",
    ageGroup: "kid"
  };

  test("works for logged in user", async function () {
    const resp = await request(app)
      .post("/posts")
      .send(newPost)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      post:
      {
        ...newPost,
        id: expect.any(Number),
        postDate: expect.any(String),
        imgUrl: null,
        description: null
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/posts")
      .send(newPost)
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /posts/:id */

describe("GET /posts/:username", function () {
  test("works for logged in users", async function () {
    const resp = await request(app)
      .get(`/posts/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      post: {
        id: testPostIds[0],
        itemName: "item1",
        username: "u1",
        city: "city1",
        category: "toy",
        ageGroup: "baby",
        postDate: expect.any(String),
        imgUrl: null,
        description: null,
        comments:[]
      },
    });
  });

  test("works for anon users", async function () {
    const resp = await request(app)
      .get(`/posts/${testPostIds[0]}`);
    expect(resp.body).toEqual({
      post: {
        id: testPostIds[0],
        itemName: "item1",
        username: "u1",
        city: "city1",
        category: "toy",
        ageGroup: "baby",
        postDate: expect.any(String),
        imgUrl: null,
        description: null,
        comments: []
      },
    });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/posts/${testPostIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      post: {
        id: testPostIds[0],
        itemName: "item1",
        username: "u1",
        city: "city1",
        category: "toy",
        ageGroup: "baby",
        postDate: expect.any(String),
        imgUrl: null,
        description: null,
        comments: []
      },
    });
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
      .get(`/posts/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /posts/:id */

describe("PATCH /posts/:id", () => {
  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/posts/${testPostIds[0]}`)
      .send({
        itemName: "NewName",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      updatedPost: {
        id: testPostIds[0],
        itemName: "NewName",
        username: "u1",
        city: "city1",
        category: "toy",
        ageGroup: "baby",
        postDate: expect.any(String),
        imgUrl: null,
        description: null,
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
      .patch(`/posts/${testPostIds[0]}`)
      .send({
        itemName: "NewName",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/posts/${testPostIds[0]}`)
      .send({
        itemName: "NewName",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/posts/${testPostIds[0]}`)
      .send({
        itemName: 99,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
})
/************************************** DELETE /posts/:id */

describe("DELETE /posts/:id", function () {
  test("works for same user", async function () {
    const resp = await request(app)
      .delete(`/posts/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: testPostIds[0] });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
      .delete(`/posts/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/posts/${testPostIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });
});


/********************************** POST /posts/:post_id/comments */

describe("POST /posts/:post_id/comments", function () {
  let newComment = {
    text: "ok"
  };

  test("works for autheticated user", async function () {
    const resp = await request(app)
      .post(`/posts/${testPostIds[0]}/comments`)
      .send(newComment)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      comment:
      {
        id: expect.any(Number),
        username:"u1",
        text:"ok",
        postId: testPostIds[0],
        commentDate: expect.any(String),
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/posts")
      .send(newComment)
    expect(resp.statusCode).toEqual(401);
  });
});


/********************** DELETE /posts/:post_id/comments/:comment_id */

describe("POST /posts/:post_id/comments/:comment_id", function () {
  test("works for autheticated user", async function () {
    const resp = await request(app)
      .delete(`/posts/${testPostIds[1]}/comments/${testCommentIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      deletedComent: testCommentIds[0]
    });
  });

  test("unauth for unautheticated user", async function () {
    const resp = await request(app)
      .delete(`/posts/${testPostIds[1]}/comments/${testCommentIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/posts/${testPostIds[1]}/comments/${testCommentIds[0]}`)
    expect(resp.statusCode).toEqual(401);
  });
});
