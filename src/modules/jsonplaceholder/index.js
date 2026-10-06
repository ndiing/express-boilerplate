const express = require("express");
const controller = require("./controller.js");

const router = express.Router();

router.post("/:sessionId/posts", controller.postPosts);
router.get("/:sessionId/posts/:id", controller.getPostsId);
router.get("/:sessionId/posts", controller.getPosts);
router.patch("/:sessionId/posts/:id", controller.patchPostsId);
router.put("/:sessionId/posts/:id", controller.putPostsId);
router.delete("/:sessionId/posts/:id", controller.deletePostsId);
router.get("/:sessionId/posts/:id/comments", controller.getPostsIdComments);

module.exports = {
    path: "/api/jsonplaceholder",
    router,
};
