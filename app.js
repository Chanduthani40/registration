//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const e = require('express');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
    secret: 'keyboardcat',
    resave: false,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//USER SCHEMA 
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})
//salting
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user,done){
    done(null,user.id);
})
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {

      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home.ejs");
})
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

//SECRETES PAGE
app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(err)
        {
            console.log(err);
        }
        else{
            res.render("secrets.ejs",{usersSubmittedSecrets:foundUsers});
        }
       })
    
})

//     register
app.route("/register")
.get(function(req,res){
    res.render("register.ejs");
})
.post(function(req,res){
   User.register({username:req.body.username},req.body.password,function(err,user){
    if(err)
    {
        console.log(err);
        res.redirect("/register");
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
    })
});

//LOGOUT
app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

//LOGIN
app.route("/login")
.get(function(req,res){
    res.render("login.ejs");
})
.post(function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
    
});

//SECRETS page
app.route("/submit")
.get(function(req,res){
    res.render("submit.ejs");

})
.post(function(req,res){
    const submittedSecret = req.body.secret;
    if(req.isAuthenticated())
    {
        User.findById(req.user.id,function(err,foundUser){
            if(err)
            {
                res.redirect("/");
            }
            else{
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                });
            }
        })
    }
    else{
        res.redirect("/login");
    }
    
})




app.listen(3000, function() {
    console.log("Server started on port 3000");
  });