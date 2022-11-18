//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email:String,
    password:String
})
const User = mongoose.model("user",userSchema);
const saltRounds = 10;

app.get("/",function(req,res){
    res.render("home.ejs");
})
app.route("/register")
.get(function(req,res){
    res.render("register.ejs");
})
.post(function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const userDetails = new User({
            email:req.body.username,
            password:hash
        })
        userDetails.save(function(err){
            if(!err)
            {
                res.render("secrets.ejs");
            }
            else{
                res.send(err)
            }
        })
    });
});
app.route("/login")
.get(function(req,res){
    res.render("login.ejs");
})
.post(function(req,res){
    User.findOne({email:req.body.username},function(err,foundList){
        if(!err)
        {
            bcrypt.compare(req.body.password, foundList.password, function(err, result) {
                if(result == true)
                {
                    res.render("secrets.ejs");
                }
                else{
                    res.render("incorrect password");
                }
                
            });
        }
        else{
            res.send(err);
        }
    })
    
});




app.listen(3000, function() {
    console.log("Server started on port 3000");
  });