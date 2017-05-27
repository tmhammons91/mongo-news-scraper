// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Bring in our Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("./public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.set('views', __dirname + '/views');
app.engine("handlebars", exphbs({ defaultLayout: "main", layoutsDir: __dirname + "/views/layouts" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/mongoscraper");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function () {
  console.log("Mongoose connection successful.");
});


//ROUTES================================================================================
app.get("/scrape", function (req, res) {
  var newArticle;
  request("http://viewfromthewing.boardingarea.com", function (error, response, html) {
    var $ = cheerio.load(html);
    $("h2.entry-title").each(function (i, element) {
      var newArticle = new Article({
        headline: $(this).children("a").text(),
        link: $(this).children("a").attr("href")
      })
      newArticle.save(function (err, data) {
        if (err) {
          console.log(err)
        }
        else {
        }
      })
    });
    res.redirect("/")
     
  });
});

app.get("/", function (req, res) {
  Article.find({})
    .exec(function (error, data) {
      if (error) {
        res.send(error);
      }
      else {
        var newsObj = {
          Article: data
        }
        res.render("index", newsObj)
      }
    })
});

app.post("/notes/:id", function (req, res) {
  var newNote = new Note(req.body);
  newNote.save(function (error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      console.log("this is the DOC " + doc)
      Article.findOneAndUpdate({
        "_id": req.params.id
      },
        { $push: { "note": doc._id } }, {new: true},  function (err, doc) {
          if (err) {
            console.log(err);
          } else {
            console.log("note saved: " + doc)
            res.redirect("/notes/" + req.params.id)
          }
        });
    }
  })
})

app.get("/notes/:id", function (req, res) {
  console.log("This is the req.params: " + req.params.id);
  Article.find({
    "_id": req.params.id
  }).populate("note")
    .exec(function (error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        var notesObj = {
          Article: doc
        }
        console.log(notesObj);
        res.render("notes", notesObj)
      }
    });
});



app.listen(8080, function () {
  console.log("News App running on port 8080")
}); 