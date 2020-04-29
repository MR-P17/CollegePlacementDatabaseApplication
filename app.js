
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
var bcrypt = require("bcrypt");
nev = require('email-verification')(mongoose);
const port = process.env.PORT;
const saltround = 8;


mongoose.connect("mongodb://localhost:27017/unipl", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true)

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
    console.log('Mongoose default connection open to ' + 'mongodb://127.0.0.1:27017/unipl');
  }); 
  
  // If the connection throws an error
  mongoose.connection.on('error',function (err) {  
    console.log('Mongoose default connection error: ' + err);
  }); 
  
  // When the connection is disconnected
  mongoose.connection.on('disconnected', function () {  
    console.log('Mongoose default connection disconnected'); 
  });
  
  // If the Node process ends, close the Mongoose connection 
  process.on('SIGINT', function() {  
    mongoose.connection.close(function () { 
      console.log('Mongoose default connection disconnected through app termination'); 
      process.exit(0); 
    }); 
  });


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

const studentSchema = {
    sroll:{
        type:String,
        required:true
    },
    sname:{
        type:String,
        required:true
    },
    sbranch:{
        type:String,
        required:true
    },
    sdegree:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    }
};

const Student = mongoose.model("Student", studentSchema), tempStudent = mongoose.model("tempStudent", studentSchema);
const User = require('./user/userModel');

/*
// sync version of hashing function
var myHasher = function(password, tempUserData, insertTempUser, callback) {
    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    return insertTempUser(hash, tempUserData, callback);
};
*/
// async version of hashing function
myHasher = function(password, tempUserData, insertTempUser, callback) {
    bcrypt.genSalt(saltround, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            return insertTempUser(hash, tempUserData, callback);
        });
    });
};



// NEV configuration =====================
nev.configure({
    // persistentUserModel: User,
    // expirationTime: 20*60*60, // 10 minutes

    verificationURL: 'http://localhost:' + port + '/verify-email/${URL}',
    transportOptions: {
        service: 'Gmail',
        auth: {
            user: process.env.USER,
            pass: process.env.PSWD
        }
    },

    verifyMailOptions: {
        from: 'Do Not Reply <' + process.env.USER + '@gmail.com>',
        subject: 'Confirm your account',
        html: '<p>Please verify your account by clicking <a href="${URL}">this link</a>. If you are unable to do so, copy and ' +
          'paste the following link into your browser:</p><p>${URL}</p>',
        text: 'Please verify your account by clicking the following link, or by copying and pasting it into your browser: ${URL}'
      },
      verifySendMailCallback: function(err, info) {
        if (err) {
          throw err;
        } else {
          console.log(info.response);
        }
      },
      
      shouldSendConfirmation: true,
      confirmMailOptions: {
        from: 'Do Not Reply <' + process.env.USER + '@gmail.com>',
        subject: 'Successfully verified!',
        html: '<p>Your account has been successfully verified.</p>',
        text: 'Your account has been successfully verified.'
      },
      confirmSendMailCallback: function(err, info) {
        if (err) {
          throw err;
        } else {
          console.log(info.response);
        }
      },
    hashingFunction: myHasher,

    /* mongo-stuff */
    persistentUserModel: User,
    // tempUserModel: null,
    // tempUserCollection: 'temporary_users',
    emailFieldName: 'email',
    passwordFieldName: 'password',
    URLFieldName: 'GENERATED_VERIFYING_URL',
    expirationTime: 20*60*60,
    passwordFieldName: 'pw',

}, function(err, options) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('configured: ' + (typeof options === 'object'));
});


nev.generateTempUserModel(User, function(err, tempUserModel) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
});


// main logic starts here
app.get("/home", function(res,res){

    Student.find({}, function(err, studentRecords){
        if(!err){
            res.render("home",{students:studentRecords});
            // res.redirect("");
        }else{
            res.status(404).send("INTERNAL ERROR!");
            console.log("No data present!");
        }
    });
});


app.get("/", function(req, res){
    // res.sendFile(__dirname + '/public/student_signup.html');
    res.render("student_signup");
});

app.get("/login", function(req, res){
    // res.sendFile(__dirname + '/public/student_signin.html');
    res.render("student_signin");
});

app.post("/",function(req, res){
    let email = req.body.email, pswd = req.body.pswd;
    let temps = new tempStudent({
        sroll: req.body.sroll,
        sname: req.body.sname,
        sbranch: req.body.sbranch,
        sdegree: req.body.sdegree,
        email: email
    });
    let user = new User({
        email: email,
        pw: pswd
    });

    // email verification function 
    evf(user, email, res, temps);
 
});

app.post("/login", function(req, res){
    let email = req.body.email, pswd = req.body.pswd;
    User.find({email: email}, function(err, record){
        if(!err){
            bcrypt.compare(pswd, record[0].pw, function(err, result) {
                if(result){
                    res.redirect("/home");
                }else{
                    res.redirect("/login");
                }
            });
        
        }else{
            console.log("login failed");
            res.status(404).send("INTERNAL ERROR!");
        }
    })
});



app.get("/company", function(req, res){
    res.render('company');
});

app.get("/interview", function(req, res){
    res.render('interview');
});

app.get("/offer", function(req, res){
    res.render('offer');
});


// user accesses the link that is sent to user
app.get("/verify-email/:URL", function(req, res) {
    var url = req.params.URL;

    nev.confirmTempUser(url, function(err, user) {
        if (user) {
            let email = user.email;
            tempStudent.find({email:email}, function(err, record){
                if(!err){
                    let s = new Student({
                        sroll: record[0].sroll,
                        sname: record[0].sname,
                        sbranch: record[0].sbranch,
                        sdegree: record[0].sdegree,
                        email: record[0].email
                    });
                    s.save();
                }
            });
            tempStudent.deleteOne({email:email}, function(err){
                if(!err){
                    console.log("Suceessfully deleted");
                }
            });

            // res.sendFile(__dirname + '/public/signin_response.html');
            res.render("signin_response");

            // not neccessary for user
            nev.sendConfirmationEmail(user.email, function(err, info) {
                if (err) {
                    // return res.status(404).send('ERROR: sending confirmation email FAILED');
                    console.log('ERROR: sending confirmation email FAILED');
                }
                
            });
        } else {
            res.status(404).send('INTERNAL ERROR: confirmation failed, either signUp again or signIn');
            console.log('ERROR: confirming temp user FAILED');
        }
    });
});


// email-verification function
const evf = function(newUser, email, res, temps){

    nev.createTempUser(newUser, function(err, existingPersistentUser, newTempUser) {
        if (err) {
            console.log("ERROR: creating temp user FAILED");
            return res.status(404).send('Internal Error!');
        }

        // user already exists in persistent collection
        if (existingPersistentUser) {
            res.send("<p>You have already signed up and confirmed your account. Did you forget your password?</p>");
        }

        
        // new user created
        if (newTempUser) {
            var URL = newTempUser[nev.options.URLFieldName];
            temps.save();
            nev.sendVerificationEmail(email, URL, function(err, info) {
                if (err) {
                    console.log("ERROR: sending verification email FAILED");
                    return res.status(404).send('Email can not sent, Internal Error!');
                }
                // save the user details in temp location
                res.send("<p>An email has been sent to you. Please check it to verify your account.</p>");
            });

            // user already exists in temporary collection!
        } else {

            res.send("<p>You have already signed up. Please check your email to verify your account.</p>")
        }
    });

}

const rve = function(email){
    nev.resendVerificationEmail(email, function(err, userFound) {
        if (err) {
            return res.status(404).send('ERROR: resending verification email FAILED');
        }
        if (userFound) {
            res.json({
                msg: 'An email has been sent to you, yet again. Please check it to verify your account.'
            });
        } else {
            res.json({
                msg: 'Your verification code has expired. Please sign up again.'
            });
        }
    });

}







app.listen(port, function(){
    console.log('server started at port: ' + port);
});