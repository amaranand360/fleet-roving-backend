
require('dotenv').config();

const http = require('http');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var ObjectId = require('mongoose').Types.ObjectId;
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const findOrCreate = require('mongoose-findorcreate');
const axios = require('axios');
const randomId  = require('random-id');
const app = express();
const port = 3000;
const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.static(__dirname + "/assets/"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({
    secret: process.env.SECRET_KEY,
    saveUninitialized: true,
    resave: true,
  }));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb+srv://bpatharun:tharun123@cluster1.3v7i9cn.mongodb.net/Fleet', {useNewUrlParser: true}).then(() => {
    console.log("connected to database");
});


///Schemas here

const loginSchema= new mongoose.Schema({
  userID: {
    type: String, default:"" 
  },
  role: {
    type: String, default:"" 
  },
    username:String,
    password:String

  });
  

  const admindata = new mongoose.Schema({
    adminID: {
      type: String, default:"" 
    },
    name: String,
    email: String,
    phoneno: String,
 
  });

  const trips = new mongoose.Schema({
    pickup: String,
    drop: String,
    pickUpLatLng: String,
    dropLatLng: String,
    distance: {
      type: Number, default:0 
    },
    Status:{
      type: String, default: "Incomplete"
    }

  })

  const VehDetails = new mongoose.Schema({
    vehType: String,
    vehNum: String,
    PassengerCapacity: Number
  })

  const driverdata = new mongoose.Schema({
    driverID: {
      type: String, default:"" 
    },
    name: String,
    email: String,
    phoneno: String,
    VehDetails: [VehDetails],
    trips: [trips]

  });

  const employeedata = new mongoose.Schema({

    name: String,
    email: String,
    phoneno: String,
    address:String,

  });


  loginSchema.plugin(passportLocalMongoose);
  loginSchema.plugin(findOrCreate);




///models here
const User =  mongoose.model("User",loginSchema);
const Admin =  mongoose.model("Admin",admindata);
const Driver =  mongoose.model("Driver",driverdata);
const Employee =  mongoose.model("Employee",employeedata);





passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser( function(user, done) {
    User.findById(user._id, function (err, user) {
    done(err, user);
  });
});




passport.use(new LocalStrategy(
  (username, password, done) => {

function ls(){
  User.findOne({ username: username },   function (err, user) {

    console.log(user);
    console.log("5555555");  
    const hashedPassword = user.password;
      console.log(hashedPassword + "in line 142");


    function verifyPassword() {
      bcrypt.compare(password, hashedPassword, (err, result)=>{
        console.log(result + " res");
        if (err) {
          console.log(err);
        }
       });  
    }

    console.log(verifyPassword()  + "SCSACSA");

          return done(null, user);
    
     
     
     });
}

setTimeout(ls, 500)

console.log("this first niggaahh");

}

));







app.get("/", (req, res)=>{
   res.render("home")
});

app.get("/fleets", (req,res)=>{

  Driver.find({}, (err, driverResult)=>{
    
    const d = driverResult;
    // console.log(d);
    res.render("fleets", {fleet:d});
  });
  

});

app.get("/employees", (req,res)=>{
  Employee.find({}, (err, EmployeeResults)=>{
    
    const e = EmployeeResults;
    // console.log(e);
    res.render("employees", {EmployeeResults:e});
  });
});

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/fleetManagement", (req,res)=>{
  res.render("fleetManagement");
});

app.get("/register", (req,res)=>{
    res.render("register");
});



app.get("/adminDashboard", (req,res)=>{

const user = req.user.role;


console.log(req.isAuthenticated + "adminDAshboard");

  if (req.isAuthenticated()) {
    const vv= req.isAuthenticated();
    console.log(vv);

    res.render("adminDashboard")
    
  }else{
    console.log("You have no prvilages to view this page");
    res.send("You have no prvilages to view this page");
  }

  // var d;

  // Driver.find({}, (err, driverResult)=>{  
  //    d = driverResult.length;
  
  //   res.render("adminDashboard", {noOfDrivers:d});
  // });
  
  // Employee.find({}, (err, driverResult)=>{  
  //   const d = driverResult.length;
  //   console.log(d);
  // });
  

});


app.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


app.get("/driverTasks", (req, res)=>{


io.on("connection", (socket) => {
  console.log(typeof(socket.id));

  console.log("Socket is active to be connected");


  // socket.on("vv", (obj, livec) =>{
  //   console.log(obj);
  //   console.log("\n");
  //   console.log(livec);
  // });

});


  const kk = req.user.userID;
  console.log(kk);
  Driver.findOne({driverID: kk }, (err, allTasks)=>{
   if (err) {
    console.log(err);
   }
   
    console.log(allTasks);
    allTasks = allTasks.trips;
    
    res.render("driverTasks", {
      allTasks:allTasks
    })
  });

});



app.post("/fleetManagement",(req, res)=>{
  
const requestedDriverID = req.body.reqDriver ;

Driver.findOne({_id: requestedDriverID}  , function(err, requestedDriverResult){

    res.render("fleetManagement", {
      reqDriver:requestedDriverResult
      });
    });
});



app.post("/addDriverTask", (req, res)=>{
    const DriverTask = req.body;
  
    const Dpickup = DriverTask.pickUp;
    const Ddrop = DriverTask.drop;
    const DpickUpLatLng = DriverTask.pickUpLatLng;
    const DdropLatLng = DriverTask.dropLatLng;
    const D = [];
console.log(DpickUpLatLng);
    var config = {
      method: 'get',
      url: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=Washington%2C%20DC&destinations=New%20York%20City%2C%20NY&units=imperial&key='+process.env.API_KEY,
      headers: { }
    };
    
    
     axios(config)
    .then(function (response) {
   
    });
    

 
    Driver.findOneAndUpdate({"_id" : DriverTask.driverId}, 
    { $push: {
      "trips": {
        "pickup": Dpickup,
        "drop": Ddrop,
        "pickUpLatLng": DpickUpLatLng,
        "dropLatLng": DdropLatLng   
      }
      }
    },{new: true, upsert: true }).exec();

 res.redirect("/fleets");
});

app.get("/driverTaskAccepted", (req, res)=> {

  res.render("DriverTaskAccepted");
})


app.get("/fleetTracking", (req, res)=>{

const f = "trips.Status";
  Driver.find({},(err, t)=>{
    res.render("fleetTracking", {fleet: t});
  })


});


app.get("/fleetDashboard", (req, res)=>{


  const userID= req.user.userID;

  Driver.findOne({driverID:userID}, (err, driver)=>{
    res.render("fleetDashboard", {driver:driver});
  })

  
});



app.post("/DriverTaskAccepted", (req, res)=>{

  const driverID = req.user.userID;
  const currentTaskId = req.body.taskId;
// const f = trips._id;
// console.log(currentTaskId);



  Driver.findOne({ driverID : driverID },'trips', (err, currentTask)=>{

    currentTask = currentTask.trips;
   
    const ii = [];
 
  currentTask.forEach((element, i) => {
    console.log(element);
    if (currentTaskId == element._id ) {
     const ii = currentTask[i];
  
     res.render("driverTaskAccepted", {
      currentTask: ii
    });
     return ii;

    } 
  });







  })



});


// app.post("/addAdmin",(req, res)=>{
//   const r = {
//     name: req.body.name,
//     email: req.body.email,
//     phoneno: req.body.phoneno,
//     pass: req.body.pass
//   }
//   console.log(r);
//   res.redirect("/adminDashboard");
// })




app.post("/addAdmin", function (req, res) {


    const len = process.env.ID_LENGTH;
    const pattern = process.env.ID_PATTERN;
    const id = randomId(len, pattern);


    User.register({ username: req.body.username }, req.body.password, function (err, client) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      else {

        const saltRounds = process.env.NO_OF_SALT_ROUNDS;
        const myPlaintextPassword = req.body.password;
console.log( saltRounds);
console.log(myPlaintextPassword);

        bcrypt.genSalt(saltRounds, function (err, salt) {
          bcrypt.hash(myPlaintextPassword, salt, function (err, hash) {
            console.log(hash);
            User.findOneAndUpdate({ "username": req.body.username },
            { userID: id, role: req.body.role, password: hash }, { new: true, upsert: true }).exec();
            console.log(hash + "hash");
          }); 
             
        });


      }
    });


    function wait(ms){
      var start = new Date().getTime();
      var end = start;
      while(end < start + ms) {
        end = new Date().getTime();
     }
   }

    console.log('before');
    wait(1000);  
    console.log('after');


    const admindata = new Admin({
      adminID: id,
      name: req.body.name,
      email: req.body.username,
      phoneno: req.body.phoneno,
    });


    console.log('before');
    wait(2000);  
    console.log('after');




    admindata.save(function (err) {
      if (!err) {
        console.log("gg");
      }
    });
  
    res.redirect("/register");
  });




  
app.post("/addFleet", (req,res)=>{

  const len = process.env.ID_LENGTH;
 
  // pattern to determin how the id will be generated
  // default is aA0 it has a chance for lowercased capitals and numbers
  const pattern = process.env.ID_PATTERN;
   
  const id = randomId(len, pattern);
 
  const saltRounds = process.env.NO_OF_SALT_ROUNDS;




    User.register({username:req.body.username},req.body.password,async function(err,client){
      if(err){
        console.log(err);
   
      }
      else{

        const pass = {key: null};

        function genPassword () {
         bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, function(err, hash) {
            console.log(hash  + " in 484 ");
            pass.key = hash;
            // User.findOneAndUpdate({"username" :req.body.username}, 
            // {  password: hash },{new: true, upsert: true }).exec().then(
            //   console.log("password stored in DB")
            // );
            
          });
          })
      }


        genPassword()




     
         User.findOneAndUpdate({"username" :req.body.username}, 
        { userID: id, role: req.body.role, password: pass.key},{new: true, upsert: true }).exec();
        
    
        console.log("[[[[[]]]]]]]]]]]]]]")
    

        

      passport.authenticate("local")(req,res,function(){
        console.log(req.user.username);
        console.log("Authenticate success");
      })



      }   

      console.log(req.body);

      
    function wait(ms){
      var start = new Date().getTime();
      var end = start;
      while(end < start + ms) {
        end = new Date().getTime();
     }
   }

   console.log('before');
   wait(2000);  
   console.log('after');




      const driverdata = new Driver({
        driverID: id,
        name:req.body.name,
        email : req.body.username,
        phoneno: req.body.phoneno,
        VehDetails: {
          vehType: req.body.vehType,
          vehNum: req.body.vehNum,
          PassengerCapacity: req.body.PassengerCapacity
        }
        });
  
  
        driverdata.save()
      
   
   

    });




    res.redirect("/register");
    
  });





  



app.post("/start", (req,res)=>{




const driverId = req.user.userID;
const status = req.body.tripStatus;
const tripId = mongoose.Types.ObjectId(req.body.tripId.trim()); ;

console.log( driverId + "\n" + status + "\n" + tripId + " \n" );
  
Driver.findOneAndUpdate({"trips._id": tripId },{$set:{"trips.$.Status":"On-going"}}, (err, rrr)=>{

});


// Driver.findOneAndUpdate({ "trips._id":  tripId }, {$set: {
//   "trips[0].Status": status
// }});


})





io.on("connection", (socket) => {
  console.log(socket.id);
  console.log("Socket is active to be connected");
  console.log();

  socket.on("gg", (obj, livec) =>{
    console.log(obj);
    console.log("\n 5555555555 \n");
    console.log(livec);
    
   
  });

});

 

app.get("/track",(req, res)=>{
  


  io.on('connection', (socket) => {
    
socket.on("vv", (obj, livec) =>{
      console.log(obj);
      console.log("\n");
      console.log(livec);

      socket.emit("hh", livec)

      // res.render("track", {latlngsocket:obj});  
    });
  console.log(livec + "999999999");

  });


})

app.post("/track", (req, res)=>{

const driverID = req.body.reqDriver;
const tripID = ObjectId(req.body.tripId);
console.log(tripID);

Driver.findOne({"trips._id":tripID },{ 'trips.$': 1 },(err, result)=>{

  res.render("track", {result:result});
})

})

  
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/log',
    failureRedirect: '/login'
  }));

app.get("/log", (req, res)=>{
  const role= req.user.role;

  if (role==="Admin") {
    res.redirect('/adminDashboard');
  } else {
    res.redirect('/fleetDashboard');
  }
})



  server.listen(port, () => {
    console.log("Server is listening at port 5000...");
  });
  

