// Node Dependencies
var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request'); // for web-scraping
var cheerio = require('cheerio'); // for web-scraping

// Import the Comment and Article models
var Note = require('../models/note.js');
var Article = require('../models/article.js');


//rendering all articles on index
router.get('/', function(req, res) {
    Article.find({})
    .populate("note")
    .exec(function(error, article) {
      if (error) {
        console.log(error);
      } else {
        res.render("index", {Article: article});
      }
    });
});



// A GET request to scrape the npr website
router.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
    request("http://www.npr.org/sections/news/", function (error, response, html){

    var $ = cheerio.load(html);
  
    var articleArray = [];

  $("h2.title").each(function(i, element) {

      // Save the text of the h4-tag as "title"
    var title = $(this).text();

    // Find the h4 tag's parent a-tag, and save it's href value as "link"
    var link = $(this).children().attr("href");

    var summary = $(element).parent().text().trim();
        
        articleArray.push({ title :  $(this).children("a").text(), link: $(this).children("a").text(), 
       summary: $(element).parent().text().trim()});
      });

    res.render("index", {articles: articleArray});

    });

});


//route for saving articles

router.post("/save", function(req, res) {
  var title = req.body.title;
  var link = req.body.link;
  var summary = req.body.summary;
  console.log(title, link, summary);

  var entry = new Article();

    // With the new "Article" object created, we can save our data to mongoose
  entry.save(function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Otherwise, send the new doc to the browser
    else {

      res.redirect("/");
    }
  });

});

// Route to retrieve and show saved articles
router.get("/savedarticles", function(req,res){
  Article.find({}, function(err, savedArticles){
    if(err){
      console.log(err);
    }
    else{
      res.render("savedarticles",
        {savedArticles : savedArticles});
    }
  });
});

// Route to remove saved article
router.get("/remove/:id", function(req,res){
  Article.remove({_id: req.params.id}, function(err){
    if (err) {
      console.log(err);
    };
    res.json({message: true, id:req.params.id});
   });
  
 res.redirect("/savedarticles");
});

// Route to save notes for an article to mongoDB via mongoose
router.post("/addnote", function(req, res) {
  
  console.log("Adding note; req.body:",req.body);
  
    Article.update({ _id: req.body.articleId}, { notes: req.body.noteText }, function(err){
    if(err)
      console.log("Error adding note:",err)
    else
      console.log("Note added to saved article.")
    }
    );
  
  res.redirect("/savedarticles");
});

// Route to retrieve notes
router.get("/getnote/:id", function(req,res){
  Article.find({
    _id: req.params.id}, function(err,found){
      if(err)
        console.log(err);
        else {
          res.json(found)
        }
    })
  });

module.exports = router;