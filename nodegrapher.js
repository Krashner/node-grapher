'use strict';

// ––––––––––––––––––––––––––––––––––––––––––––––––– IMPORT AND CONFIGURE NPM PACKAGES ––––––––––––––––––––––––––––––––––––––––––––––––– //

const express = require('express'); // for webpage managment with NodeJS
const nodegrapher = express(); // creating a new webpage management instance
const nodemailer = require('nodemailer');
const exphbs = require('express-handlebars'); // web template middleware engine
const bodyParser = require('body-parser'); // for parsing HTTP requests and responses
const dotenv = require('dotenv').config();; // set up config for ".env" file
const path = require('path'); // core JS module for handling file paths
const bcrypt = require('bcrypt'); //for hashing passwords

// –––––––––––––––––––––––––––––––––––––––––––––––– IMPORT AND CONFIGURE CUSTOM PACKAGES ––––––––––––––––––––––––––––––––––––––––––––––– //

// const conn = require('./db_connection'); // import the database connection object

// ––––––––––––––––––––––––––––––––––––––––––––––– SETUP PUBLIC RESOURCES AND MIDDLEWARE ––––––––––––––––––––––––––––––––––––––––––––––– //

//var router = express.Router(); // for webpage routing with NodeJS
//var path = __dirname + '/views/'; // set default file path for HTML views
//nodegrapher.use("/", router);

//public directory and view routing
// nodegrapher.use(express.static(__dirname + '/public')); // set default file path for public resources (images, stylesheets, etc...)
nodegrapher.use('/', express.static(path.join(__dirname, '/public')));

// Declare view engine setup
nodegrapher.engine('handlebars', exphbs());
nodegrapher.set('view engine', 'handlebars');

// Body Parser Middleware
nodegrapher.use(bodyParser.urlencoded({ extended: false }));
nodegrapher.use(bodyParser.json());

// This will print HTTP request methods live as they happen
nodegrapher.use(function (req,res,next) {
    console.log(`Request –> (Method: ${req.method}, URL: ${req.url})`)
    next();
});

// ––––––––––––––––––––––––––––––––––––––––––––––––––––– CHECK DATABASE FOR TABLE –-----–––––––––––––––––––––––––––––––––––––––––––––––– //

// //create users table if it doesn't exist
// conn.query("SELECT * FROM INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA = 'nodegrapher_mysql_app' AND TABLE_NAME = 'Users'", // see if "Users" table exists
// (err, results, fields) => {
//     if(results.length <= 0) { // if Users table DOES NOT exist
//         conn.query("CREATE TABLE Users(Username VARCHAR(255), Password VARCHAR(255), UserID INT NOT NULL AUTO_INCREMENT, PRIMARY KEY(UserID))");
//         console.log("User Table Created")
//     }
//     else { //if Users table DOES exist
//         console.log("User Table exists");
//     }
// });

//create graphs table if it doesn't exist
//todo figure out foreign keys
// conn.query("SELECT * FROM INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA = 'nodegrapher_mysql_app' AND TABLE_NAME = 'Graphs'", // see if "Users" table exists
// (err, results, fields) => {
//     if(results.length <= 0) { // if Users table DOES NOT exist
//         // conn.query("CREATE TABLE Users(Graphs VARCHAR(255), Password VARCHAR(255), GraphID INT NOT NULL AUTO_INCREMENT, PRIMARY KEY(GraphID))");
//         console.log("Graphs Table Created")
//     }
//     else { //if Users table DOES exist
//         console.log("Graphs Table exists");
//     }
// });

// ––––––––––––––––––––––––––––––––––––––––––––––––––––– HANDLE HTTP GET REQUEST PATHS ––––––––––––––––––––––––––––––––––––––––––––––––– //

// Get root (index) route
nodegrapher.get("/",function(req,res){
    res.render('index', {layout: false});
});

// Get about route
nodegrapher.get("/about",function(req,res){
    res.render('about', {layout: false});
});

// Get contact route
nodegrapher.get("/contact",function(req,res){
    res.render('contact', {layout: false});
});

// Get login route
nodegrapher.get("/login",function(req,res){
    res.render('login', {layout: false});
});

// ANY ROUTE THAT IS NOT EXPLICITLY SET WILL HIT THIS VIEW
nodegrapher.get("/*",function(req,res){
    res.render('404', {layout: false});
});

// –––––––––––––––––––––––––––––––––––––––––––––––––––––– HANDLE HTTP POST REQUESTS –––––––––––––––––––––––––––––––––––––––––––––––––––– //

//handle the POST reqeuest to login
// nodegrapher.post('/account_login_attempt', (req, res) => {

//     let username = req.body.login_username;
//     let password = req.body.login_password;
    
//     //find the input username's password
//     conn.query("SELECT Password FROM Users WHERE Username = ?", [username], (err, results, fields) => {
//         if (err){
//             console.log(err);
//             res.render('login', {loginMsg: "An error occurred", layout: false});
//             return;
//         }
//         if(results.length > 0 && results[0].Password){
//             //compare the input password with the hashed password
//             bcrypt.compare(password, results[0].Password, (err, result)=>{
//                 if(result){
//                     res.render('login', {loginMsg: "Logged in as " + username, layout: false});
//                 }else{
//                     res.render('login', {loginMsg: "Invalid username or password", layout: false});
//                 }
//             });
//         }else{
//             res.render('login', {loginMsg: "Invalid username or password", layout: false});
//         }
//     });
// });


// //handle the POST reqeuest to login
// nodegrapher.post('/account_create_attempt', (req, res) => {

//     let username = req.body.create_username;
//     let password = req.body.create_password;

//     //12 if the amount to salt, roughly doubles time for every 1
//     bcrypt.hash(password, 12, (err, hash)=>{
//         //try to create account if given username doesn't exist
//         conn.query("SELECT Username FROM Users WHERE Username = ?", [username], (err, results, fields) => {
//             if (err){
//                 console.log(err);
//                 res.render('login', {createMsg: "An error occurred", layout: false});
//                 return;
//             }
//             if(results.length == 0){
//                 conn.query("INSERT INTO Users (Username, Password) VALUES (?, ?)", [username, hash], (err, results, fields) => {
//                     if (err) {
//                         console.log(err);
//                         res.render('login', {createMsg: "Could not create account", layout: false});
//                         return;
//                     }
//                     else {
//                         res.render('login', {createMsg: "Account created", layout: false});
//                         return;
//                     }
//                 });
//             }else{
//                 res.render('login', {createMsg: "Account already exists", layout: false});
//             }
//         });
//     });
// });

// Handle the POST request sent to the "/sendEmail" route
nodegrapher.post('/sendEmail', (req, res) => {
    // CREATE YOUR OWN EMBEDDED HTML TEMPLATE STRING WITH name, school, email, phone, and message CONTACT DETAILS
    const EMAIL_HTML_BODY = `
      <p>Name: ${req.body.name}</p>
      <p>Email: ${req.body.email}</p>
      <p>Message: ${req.body.message}</p>`; // create the body of the email with embedded HTML
  
      const AUTH_ENV = {  
        user: process.env.TTU_WP_EMAIL_ADDR,
        pass: process.env.TTU_WP_EMAIL_PASS,
        accessToken: process.env.EMAIL_ACCESS_TOKEN
      }
  
    // Create reusable transporter object defined with the NodeMailer module
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: AUTH_ENV
    });
  
    // Setup email data object
    let mailOptions = {
        from: '"Justin Buttrey\'s NodeGrapher App" <csc3100dummy@gmail.com>', // sender address
        to: "justin@jbuttrey.com", // comma separated list of receivers
        cc: null, // carbon copy option address option
        bcc: null, // blind carbon copy address option
        subject: 'Justin Buttrey\'s NodeMailer App (New Contact Request)', // Subject line
        html: EMAIL_HTML_BODY // html body
    };
  
    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        }
        else{
            console.log('Message sent: %s', info.messageId);
        }
        res.render('contact', {layout: false});
    });
});

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– START SERVER –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– //

// Start the server on Unix environment variable PORT or 8080
const PORT = process.env.PORT || 8080;
nodegrapher.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
    console.log('')
});

module.exports = nodegrapher;