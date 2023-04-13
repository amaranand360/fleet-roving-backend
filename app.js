
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
const { isTypedArray } = require('util/types');
const app = express();
const port = process.env.PORT;
const server = require("http").createServer(app);
const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
//Required package
// const pdf = require("pdf-creator-node");
const fs = require("fs");
const pdf = require("html-pdf");
const path = require("path");
// Read HTML Template
const template = fs.readFileSync("template.ejs", "utf8");
const { type } = require('os');


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


mongoose.connect( process.env.MONGO_URL , {useNewUrlParser: true}).then(() => {
    console.log("connected to database");
});


///Schemas here

const loginSchema= new mongoose.Schema({
  userID: {
    unique: true,
    type: String, default:"" 
  },
  role: {
    type: String, default:"" 
  },
  username: {
      unique: true,
      type: String, default:"" 
    },
    passwordHash: {
      type: String, default:"" 
    },

  });
  

  const admindata = new mongoose.Schema({
    adminID: {
      type: String, default:"" ,
      unique:true
    },
    name: String,
    email: String,
    phoneno: String,
 
  });

  
  const VehDetails = new mongoose.Schema({
    vehType: String,
    vehNum: String,
    PassengerCapacity: Number
  })

const boardingEmp = new mongoose.Schema({
  employeeID: String,
  name : String,
  email: String,
  phoneno: String,
  address: String,
  cordinates:String 


});

  const trips = new mongoose.Schema({
    tripID: String,
    pickup: String,
    drop: String,
    pickUpLatLng: String,
    dropLatLng: String,
    distance : {
      type: Number, default:0 
    },
    Status :{
      type: String, default: "Incomplete"
    },
    billAmount : {
      type: Number, default:0 
    },
    billStatus :{
      type: String, default: "Pending"
    },
    boardingEmp: [boardingEmp]

  })

  // Pending
  // processing
  // settled

  const driverdata = new mongoose.Schema({
    driverID: {
      type: String, default:"" ,
      unique:true
    },
    name: String,
    email: String,
    phoneno: String,
    VehDetails: [VehDetails],
    trips: [trips],
    
  });


  const empTrips = new mongoose.Schema({
    tripID: String,
    driverID: String,
    driverName: String,
    driverNum: String,
    vehNum: String,
    pickUpCords: String,
  });


  const employeedata = new mongoose.Schema({
    employeeID: {
      type: String, default:"" ,
      unique:true
    },
    name: String,
    email: String,
    phoneno: String,
    address:String,
    cordinates:String,
    empTrips: [empTrips]

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


    const hashedPassword = user.passwordHash;

    console.log(password);

    console.log(user.hash);


    function verifyPassword() {
      bcrypt.compare(password, hashedPassword, (err, result)=>{
        console.log(result + " res");
        if (result === false) {
          console.log(err);
          done(null, false, { message: 'Incorrect email.' });
        } else{
          console.log("Authed");
          return done(null, user);
        }
       });  
    }

    console.log(verifyPassword()  + "SCSACSA");

  
    
     
     
     });
}

setTimeout(ls, 500);



}

));



// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   auth: {
//     user: 'fleetroving@gmail.com',
//     pass: "pjleezcvmkfkumkf"
//   },
// });
    
// var mailOptions = {
//   from: 'fleetroving@gmail.com',
//   to: 'anjumafsana05@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'Hey! How r u??'
// };
    
// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });


const templatePath = "views/bookingEmailTemplate.ejs";


app.post("/dTask", (req, res)=>{



  console.log("********************");
const trip = req.body
console.log(trip);
// const yy = JSON.stringify(req.body.selectedEmps)
// const gg = yy;
// console.log(typeof(gg));
// console.log(gg);
const qr = "trips.boardingEmp.employees";

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
    "dropLatLng": DdropLatLng,   
    "boardingEmp": trip.selectedEmps
  }
  }
},{new: true, upsert: true }).exec();

Driver.findOne({"trips.tripID":id },{ 'trips.$': 1 } ,(err, result)=>{
console.log(result);
});


Driver.findOneAndUpdate( {"trips.tripID":id , 'trips.$': 1 } , { 
  $push : {"trips.boardingEmp" :{
    "emp.employeeID": element.employeeID,
    "emp.name" : element.name,

  }
  } } ,{new: true}, {upsert: true }).exec();

  Driver.findOneAndUpdate({"trips.tripID":id },{ 'trips.$': 1 }, { 
    $push : {"trips.boardingEmp.employees" : trip.selectedEmps
    } } ,{new: true, upsert: true }).exec();

res.redirect("/fleets");

})



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


app.get("/employeeDashboard", (req,res)=>{

  const userID= req.user.userID;


Employee.findOne({employeeID: userID}  , function(err, empresult){

    res.render("employeeDashboard", {
      empresult:empresult
      });
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
    const ongng = trips.Status;


    Driver.count({}, (err, drivercount)=>{
      Driver.find({},(err, fleetcount)=>{
       Employee.count({},(err, empCount)=>{

        Driver.find({  },{ongng : "Incomplete"}, (err, onGoing)=>{
          res.render("adminDashboard", {drivercount:drivercount,fleetcount:fleetcount,empCount:empCount,onGoing:onGoing})
    
        })
        

       })
        


        
      })
    })


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

Employee.find({},(err, result)=>{


Driver.findOne({_id: requestedDriverID}  , function(err, requestedDriverResult){

    res.render("fleetManagement", {
      reqDriver:requestedDriverResult,result:result
      });
    });
});
});

const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'fleetroving@gmail.com',
    pass: "pjleezcvmkfkumkf"
  },
};
const transporter = nodemailer.createTransport(smtpConfig);

app.get("/bookingEmailTemplate",(req, res)=>{
  res.render("bookingEmailTemplate");
});



app.post("/addDriverTask", (req, res)=>{
  const len = process.env.ID_LENGTH;
  const pattern = process.env.ID_PATTERN;
  const id = randomId(len, pattern);
    const DriverTask = req.body;
    console.log(DriverTask);
  
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
    

 
    Driver.findOneAndUpdate({"_id" : DriverTask.driverId} , 
    { $push: {
      "trips": {
        "tripID" : id,
        "pickup": Dpickup,
        "drop": Ddrop,
        "pickUpLatLng": DpickUpLatLng,
        "dropLatLng": DdropLatLng   
      }
      }
    },{new: true, upsert: true }).exec();


    
    Employee.find({"employeeID": {$in: DriverTask.add}}, (err, selectedEmpDetails)=>{
      console.log("::::::::::::::");
      console.log(selectedEmpDetails);
      console.log(id);

    selectedEmpDetails.forEach(element => {
      console.log("DDDDDDDDDDDDDDDDDDDDDD");



Driver.findOne({"_id" : DriverTask.driverId}, (err, dr)=>{


  const data =  
    {
     DriverName: dr.name,
     DriverID: dr.driverID,
     DriverPhoneNo: dr.phoneno,
     tripID:  id,
     empName: element.name
    }
     

     ejs.renderFile(templatePath, data, (err, html) => {
      if (err) {
        console.error(err);
      } else {
    
     // MAIL comment
    
  //    const mailOptions = {
  //   from: 'fleetroving@gmail.com',
  //   to: element.email,
  //   subject: 'Fleet assaigned',
  //   html: html
  //       };

  // transporter.sendMail(mailOptions, function(error, info){
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Email sent: ' + info.response);
  //   }
  // });



      }
    });



  Driver.findOneAndUpdate( { "driverID":dr.driverID, "trips.tripID": id }, {
    $push:{
        "trips.$[elem].boardingEmp" : [{   
          employeeID: element.employeeID,
          name : element.name,
          email: element.email,
          phoneno: element.phoneno,
          address: element.address,
          cordinates:element.address  }]
    }
  },{
    new: true,
    arrayFilters:[{
      "elem.tripID": id
    }]
  }, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  }  );


 


Employee.findOneAndUpdate({"employeeID": element.employeeID},{
  $push:{
    "empTrips":{
      tripID: id,
      driverID: dr.driverID,
      driverName: dr.name,
      driverNum: dr.phoneno,
      vehNum: dr.VehDetails[0].vehNum,
      pickUpCords: element.cordinates
    }
  }
},{new: true, upsert: true }).exec();


  console.log("{}{}{}{}{}{}");
  console.log(dr.driverID);

}),
    



      console.log(element.name);
      console.log(DriverTask.driverId);
      console.log("DDDDDDDDDDDDDDDDDDDDDD");


    });

    })



    



 
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

console.log(req.body);



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

    
    function wait(ms){
      var start = new Date().getTime();
      var end = start;
      while(end < start + ms) {
        end = new Date().getTime();
     }
   }



    User.register({ username: req.body.username }, req.body.password, function (err, client) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      else {

        const pass = {key: null};

        function genPassword () {
         bcrypt.genSalt(10, (err, salt) => {
          console.log(salt);
          console.log("987");
          bcrypt.hash(req.body.password, salt, function(err, hash) {
            console.log(hash  + " in 946 ");
            pass.key = hash;
            User.findOneAndUpdate({"username" :req.body.username}, 
            {  "$set":{
              passwordHash: hash
            } },{new: true, upsert: true }).exec().then(
              console.log("password stored in DB")
            );
            
          });
          })
      }


        genPassword()




     
         User.findOneAndUpdate({"username" :req.body.username}, 
        { userID: id, role: req.body.role,},{new: true, upsert: true }).exec();


        
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, function(err, user) {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       bcrypt.compare(password, user.passwordHash, function(err, res) {
//         if (res) {
//           return done(null, user);
//         } else {
//           return done(null, false);
//         }
//       });
//     });
//   }
// ));


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


  

app.get("/empPrevTrips", (req, res)=>{
    Employee.find({"EmployeeID": req.user.userID}, (err, emp)=>{
    console.log(emp[0].empTrips);
    res.render("empPrevTrips", {trips:emp[0].empTrips });
  });
});

  
app.post("/addEmp", function (req, res) {


  const len = process.env.ID_LENGTH;
  const pattern = process.env.ID_PATTERN;
  const id = randomId(len, pattern);


  User.register({ username: req.body.username }, req.body.password, function (err, client) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {

        const pass = {key: null};

        function genPassword () {
         bcrypt.genSalt(10, (err, salt) => {
          console.log(salt);
          console.log("987");
          bcrypt.hash(req.body.password, salt, function(err, hash) {
            console.log(hash  + " in 946 ");
            pass.key = hash;
            User.findOneAndUpdate({"username" :req.body.username}, 
            {  "$set":{
              passwordHash: hash
            } },{new: true, upsert: true }).exec().then(
              console.log("password stored in DB")
            );
            
          });
          })
      }


        genPassword()




     
         User.findOneAndUpdate({"username" :req.body.username}, 
        { userID: id, role: req.body.role,},{new: true, upsert: true }).exec();


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


  const empdata = new Employee({
    employeeID: id,
    name: req.body.name,
    email: req.body.username,
    phoneno: req.body.phoneno,
    address: req.body.address,
    cordinates:req.body.cordinates
  });


  console.log('before');
  wait(2000);  
  console.log('after');




  empdata.save(function (err) {
    if (!err) {
      console.log("gg");
    }
  });

  res.redirect("/register");
});








app.get("/fleetBilling", (req, res)=>{
  Driver.find({}, (err, driverResult)=>{
    
    const d = driverResult;
    // console.log(d);
    res.render("fleetBilling", {fleet:d});
  });
  
});

app.get("/contactUs",(req, res)=>{
  res.render("contactUs");
})

app.get("/subscribe",(req, res)=>{
  res.render("subscribe");
})

app.get("/template",(req, res)=>{
  res.render("template");
})



app.post("/doBill",(req, res)=>{

  const requestedDriverID = req.body.reqDriver ;
  
  console.log(requestedDriverID);
  
  
  
  Driver.find( {_id: requestedDriverID}  , function(err, requestedDriverResult){
      // res.render("fleetManagement", {
      //   trips:requestedDriverResult.trips
      //   });



// console.log(requestedDriverResult[0].trips);




console.log("//////////////////");
    const driverBill = requestedDriverResult[0];
    const tripDetails = requestedDriverResult[0].trips
    const pendingBills= [] ;
    tripDetails.forEach(element => {
        if (element.billStatus === "Pending") {
          pendingBills.push(element)

        }
      });

      // const template = Handlebars.compile("<p>Bill amount: {{this.billAmount}}</p>", { allowProtoPropertiesByDefault: true });
      // const context = { billAmount: 100 };
      // const html = template(context);
  //     const driverBillz = driverBill.filter(element => element.billStatus === "Pending").map(({ billAmount, billStatus }) => ({ billAmount, billStatus }));

      console.log(pendingBills);

  //     const document = {
  //       html : html,
  //       path: "./output.pdf",
  //       type: "",
  //       data: {driverBillz},
  //       handlebars: {
  //         runtimeOptions: {
  //           allowProtoPropertiesByDefault: true,
  //           allowProtoMethodsByDefault: true,
  //         },
  //       },
  //     };

  
  // const options = {
  //   format: "A4",
  //   orientation: "portrait",
  //   border: "10mm",
  //   header: {
  //       height: "45mm",
  //       contents: '<div style="text-align: center;">Author: Shyam Hajare</div>'
  //   },
  //   footer: {
  //       height: "28mm",
  //       contents: {
  //           first: 'Cover page',
  //           default: '<span style="color: #444;"> 55 </span>/<span> 777 </span>', // fallback value
  //           last: 'Last Page'
  //       }
  //   },
    
  // };



  //     pdf
  //     .create(document, options)
  //     .then((res) => {
  //       console.log(res);
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //     });



  ejs.renderFile('views/template.ejs', {driverBill:driverBill, pendingBills:pendingBills}, (err, html) => {
    if (err) {
      console.log("ERROR:");
      console.error(err);
      return;
    }
  


    const options = { format: 'Letter',
    "width": "8.5in", };
    pdf.create(html, options).toFile('./report.pdf', (err, res) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(res);
    });


    // MAIL comment

    const mailOptions = {
      from: 'fleetroving@gmail.com',
      to: driverBill.email,
      subject: 'Bill Generated',
      attachments: [{
        filename: 'report.pdf',
        path: 'D:/WEB DEVELOPMENT/projects/fleet_management/report.pdf',
        contentType: 'application/pdf'
      }],
          };
  
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });


  });
  
  


  
  res.render("template", {driverBill:driverBill, pendingBills:pendingBills});

      });
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
          console.log(salt);
          console.log("987");
          bcrypt.hash(req.body.password, salt, function(err, hash) {
            console.log(hash  + " in 946 ");
            pass.key = hash;
            User.findOneAndUpdate({"username" :req.body.username}, 
            {  "$set":{
              passwordHash: hash
            } },{new: true, upsert: true }).exec().then(
              console.log("password stored in DB")
            );
            
          });
          })
      }


        genPassword()




     
         User.findOneAndUpdate({"username" :req.body.username}, 
        { userID: id, role: req.body.role,},{new: true, upsert: true }).exec();
        
    
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


console.log(req.body);

const driverId = req.user.userID;
const status = req.body.tripStatus;
const tripId = mongoose.Types.ObjectId(req.body.tripId.trim()); ;


console.log( driverId + "\n" + status + "\n" + tripId + " \n" );
  
Driver.findOneAndUpdate({"trips._id": tripId },{$set:{"trips.$.Status":"On-going","trips.$.distance": req.body.distance }}, (err, rrr)=>{

});

Driver.findOne({driverID: driverId}, (err, fltRes)=>{

  let thisFare = 0;

  if (fltRes.VehDetails[0].vehType === "SUV" ) {
     thisFare = 20;
  } else if (fltRes.VehDetails[0].vehType === "MINI") {
     thisFare = 16;
  }

  const totalBill = req.body.distance * thisFare;
  console.log("total bill is" + totalBill);
   
Driver.findOneAndUpdate({"trips._id": tripId },{$set:{"trips.$.billAmount": totalBill ,"trips.$.billStatus": "Pending" }}, (err, rrrr)=>{


  

});

});


// Driver.findOneAndUpdate({ "trips._id":  tripId }, {$set: {
//   "trips[0].Status": status
// }});


});


app.post("/end", (req,res)=>{


  console.log(req.body);
  
  const driverId = req.user.userID;
  const status = req.body.tripStatus;
  const tripId = mongoose.Types.ObjectId(req.body.tripId.trim()); ;
  
  console.log( driverId + "\n" + status + "\n" + tripId + " \n" );
    
  Driver.findOneAndUpdate({"trips._id": tripId },{$set:{"trips.$.Status":"Completed" }}, (err, rrr)=>{
  res.redirect("/fleetDashboard");
  });
  
  
  // Driver.findOneAndUpdate({ "trips._id":  tripId }, {$set: {
  //   "trips[0].Status": status
  // }});
  
  
  });




const livecl = [];
const singleCrdn = [{
  "name":"John",
  "age":30
  }];

io.on("connection", (socket) => {
  console.log(socket.id);
  console.log("Socket is active to be connected");
  console.log();

  socket.on("gg", (obj, livec) =>{
    // console.log(obj);
    // console.log(livec);
    // console.log("\n 800 \n");
    singleCrdn == obj;
    livecl.push(obj)
    singleCrdn.push(obj)
    singleCrdn.shift();
    console.log(singleCrdn);
});

  });




  
  io.on("connection", (socket) => {
    console.log(socket.id);
    console.log("Socket II is active to be connected");
    console.log();
  
setInterval(() => {
  socket.emit("fromserver", singleCrdn,livecl);   
}, 3500);
  
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

Driver.findOne({"trips._id":tripID },{ 'trips.$': 1 } ,(err, result)=>{

  res.render("track", {result:result});
});

});



app.post("/addEmpToFleet", (req, res)=>{
  Employee.find({},(err, result)=>{
    res.render("empWaiting", {result:result});
  })
});

app.post("/theseEmployees", (req, res)=>{
console.log(req.body.add);

// declare an array and store the received values in it 
// and by using a foreach loop find each elements data and send it to fleetMAnagement page

// add trip to DB after optimizing the direction of the location 

const selectedEmp = req.body.add;
const reqD = [req.user.userID];
console.log();
console.log("//");
console.log(selectedEmp);




Driver.findOne({"adminID" : reqD}, (err, reqDriver)=>{

  console.log(reqDriver);

Employee.find({"employeeID": {$in: selectedEmp}}, (err, selectedEmpDetails)=>{
  console.log("::::::::::::::");
  console.log(selectedEmpDetails);
  console.log();
  res.render("theseEmployees", {
     selectedEmpDetails:selectedEmpDetails,reqDriver:reqDriver
  })
})


  
  });
  
})






app.get("empWaiting",(req,res)=>{
  res.render("empWaiting");
})


  
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/log',
    failureRedirect: '/login'
  }));

app.get("/log", (req, res)=>{
  const role= req.user.role;

  if (role==="Admin") {
    res.redirect('/adminDashboard');
  } else if (role === "Fleet") {
    res.redirect('/fleetDashboard');
  }else if (role === "Employee"){
    res.redirect("/employeeDashboard");
  }``
})



  server.listen(port, () => {
    console.log("Server is listening at port 3000...");
  });
  

