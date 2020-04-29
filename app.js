
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
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

const Student = mongoose.model("Student", studentSchema);
// main logic starts here
app.get("/home", function(res,res){

    Student.find({}, function(err, studentRecords){
        if(!err){
            res.render("home",{students:studentRecords});

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

app.post("/",function(req, res){
    let email = req.body.email, pswd = req.body.pswd;
    let s = new Student({
        sroll: req.body.sroll,
        sname: req.body.sname,
        sbranch: req.body.sbranch,
        sdegree: req.body.sdegree,
        email: email
    });
    Student.find({email:email}, function(err, record){
        if(!err){
            if(record.length === 0){
                s.save();
            }
        }
    });
    setTimeout(function(){
        res.redirect("/home");
    }, 1500);
 
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






app.listen(port, function(){
    console.log('server started at port: ' + port);
});