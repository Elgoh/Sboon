const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');

const app = express();

// game add on
//const {MongoClient} = require('mongodb')
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.on('connection', (socket) => {
  console.log('a User connected');
  

  //Welcome current user
  socket.emit('message', 'Welcome to Lie || Die');

  // Broadcast when a user connects
  socket.broadcast.emit('message', 'A user has joined the game');

  socket.on('disconnect', () => {
    io.emit('message', 'A user has left the game');
  });

  //listen for chat message
  // socket.on('new-user', name => {
  //   io.emit('message', msg);
  // });
});

//img source
app.use('/img', express.static(__dirname + '/img'));

module.exports.getIO = ()=>{
  return io;
}

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').MongoURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// game add on
//const dd = mongoose.connection;

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));
app.use('/game', require('./routes/game.js'));

const PORT = process.env.PORT || 5000;

http.listen(PORT, console.log(`Server started on port ${PORT}`));

// dd.on('error', error => console.error(error));
// dd.once('open', () => console.log('Connected to mongoose'));
