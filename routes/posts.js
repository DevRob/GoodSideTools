const passport = require("passport")
const router = require("express").Router()
const db = require("../db")

function loginRequired(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login")
  }
  next()
}

function adminRequired(req, res, next) {
  if (req.user.user_level !== 0) {
    return res.render("403")
  }
  next()
}

router
  .get("/posts", loginRequired, (req, res, next) => {
    db("posts")
      .where("user_id", req.user.id)
      .then((posts) => {
        db("users")
          .where("id", req.user.id)
          .then((user) => {
            res.render("posts", {
              title: user[0].first_name + "'s posts",
              posts: posts,
            })
          })
      })
  })
  .get("/allPosts", loginRequired, adminRequired, (req, res, next) => {
    db("posts")
      .then((posts) => {
        res.render("posts", {
          title: "all user posts",
          posts: posts,
        })
      })
  })
  .get("/deletePost/:id", loginRequired, (req, res, next) => {
    const query = db("posts").where("id", req.params.id)
    if (req.user.user_level !== 0) {
      query.andWhere("user_id", req.user.id)
    }

    query
      .delete()
      .then((result) => {
        if (result === 0) {
          return res.send("Error, could not delete post")
        }
        res.redirect("/posts")
      })
  })

module.exports = router
