"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testPostIds,
  u1Token,
  u2Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "u1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "u2@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@user.com",
        isAdmin: false,
        posts: [testPostIds[0]],
        likedPosts: [],
        sentInvites: [{ postOwner: 'u2', postId: testPostIds[1] }],
        receivedInvites: []
      },
    });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/users/u2`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@user.com",
        isAdmin: false,
        posts: [testPostIds[1]],
        likedPosts: [testPostIds[0]],
        sentInvites: [],
        receivedInvites: [{ username: 'u1', postId: testPostIds[1] }]
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@user.com",
        isAdmin: false,
        posts: [testPostIds[0]],
        likedPosts: [],
        sentInvites: [{ postOwner: 'u2', postId: testPostIds[1] }],
        receivedInvites: []
      },
    });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "u1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "u1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: can set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /users/:username/email */

describe("GET /users/:username/email", function () {
  test("works for loggedin", async function () {
    const resp = await request(app)
      .get(`/users/u2/email`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ email: "u2@user.com" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get(`/users/u2/email`)
    expect(resp.statusCode).toEqual(401);
  });
});


/************************************** POST /users/:username/like/:id */

describe("POST /users/:username/like/:id", function () {
  test("works for current user", async function () {
    const resp = await request(app)
      .post(`/users/u1/like/${testPostIds[1]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ liked: testPostIds[1] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post(`/users/u1/like/${testPostIds[1]}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for other user", async function () {
    const resp = await request(app)
      .post(`/users/u1/like/${testPostIds[1]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});


/************************************** DELETE /users/:username/like/:id */

describe("DELETE /users/:username/like/:id", function () {
  test("works for current user", async function () {
    const resp = await request(app)
      .delete(`/users/u2/like/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ unliked: testPostIds[0] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u2/like/${testPostIds[0]}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for other user", async function () {
    const resp = await request(app)
      .delete(`/users/u2/like/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** POST /users/:username/invite/:id */

describe("POST /users/:username/invite/:id", function () {
  test("works for current user", async function () {
    const resp = await request(app)
      .post(`/users/u2/invite/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ invite: testPostIds[0] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post(`/users/u2/invite/${testPostIds[0]}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for other user", async function () {
    const resp = await request(app)
      .post(`/users/u2/invite/${testPostIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** DELETE /users/:username/invite/:id */

describe("DELETE /users/:username/invite/:id", function () {
  test("works for current user", async function () {
    const resp = await request(app)
      .delete(`/users/u1/invite/${testPostIds[1]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ uninvite: testPostIds[1] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u1/invite/${testPostIds[1]}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for other user", async function () {
    const resp = await request(app)
      .delete(`/users/u1/invite/${testPostIds[1]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});