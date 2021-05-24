"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Post = require("./post.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPostIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newPost = {
    itemName: "testItem",
    username: "u1",
    city: "testCity",
    category: "book",
    ageGroup: "kid"
  };

  test("works", async function () {
    let post = await Post.create(newPost);
    expect(post).toEqual({
      ...newPost,
      id: expect.any(Number),
      postDate: expect.any(String),
      imgUrl: null,
      description: null
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let posts = await Post.findAll();
    expect(posts).toEqual([
      {
        id: testPostIds[0],
        itemName: "item1",
        username: "u1",
        city: "city1",
        category: "toy",
        ageGroup: "baby",
        postDate: expect.any(String),
        imgUrl: null
      },
      {
        id: testPostIds[1],
        itemName: "item2",
        username: "u2",
        city: "city2",
        category: "book",
        ageGroup: "kid",
        postDate: expect.any(String),
        imgUrl:null
      },
    ]);
  });


  test("works: by name", async function () {
    let posts = await Post.findAll({ itemName: "1" });
    expect(posts).toEqual([
      {
        id: testPostIds[0],
        itemName: "item1",
        username: "u1",
        city: "city1",
        category: "toy",
        ageGroup: "baby",
        postDate: expect.any(String),
        imgUrl: null
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let post = await Post.get(testPostIds[0]);
    expect(post).toEqual({
      id: testPostIds[0],
      itemName: "item1",
      username: "u1",
      city: "city1",
      category: "toy",
      ageGroup: "baby",
      postDate: expect.any(String),
      imgUrl: null,
      description:null,
      comments: [{
        id: expect.any(Number),
        username: "u2",
        text: "good",
        postId: testPostIds[0],
        commentDate: expect.any(String),
      }]
    });
  });

  test("not found if no such post", async function () {
    try {
      await Post.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  let updateData = {
    itemName: "NewName",
  };
  test("works", async function () {
    let post = await Post.update(testPostIds[0], updateData);
    expect(post).toEqual({
      id: testPostIds[0],
      username: "u1",
      city: "city1",
      category: "toy",
      ageGroup: "baby",
      postDate: expect.any(String),
      imgUrl: null,
      description: null,
      ...updateData,
    });
  });

  test("not found if no such post", async function () {
    try {
      await Post.update(0, {
        itemName: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Post.update(testPostIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Post.remove(testPostIds[0]);
    const res = await db.query(
      "SELECT id FROM posts WHERE id=$1", [testPostIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such post", async function () {
    try {
      await Post.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
