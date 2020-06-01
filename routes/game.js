const express = require('express');
const app = express();
const router = express.Router();
// const { handleError, ErrorHandler } = require('../models/error');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const server = require('../app');
const io = server.getIO();
var numberCount = 0; // initiate array from 0. Will have to change this when we get a huge data base or the array will get too big
var currentName;
const SOCKET_LIST = {};
const PLAYER_LIST = {};

// Gameboard
router.get('/gameboard', ensureAuthenticated, (req, res) => {
    currentName = req.user.name
    res.render('gameboard', {
        playerName: req.user.name,
        user: req.user
    })
})

var Player = (name) => {
    var self = {
        x:50,
        y:50,
        name: name,
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSpeed: 3
    }
    self.updatePosition = function() {
        if (self.pressingRight) {
            self.x = self.x + self.maxSpeed;
        }
        if (self.pressingLeft) {
            self.x = self.x - self.maxSpeed;
        }
        if (self.pressingUp) {
            self.y = self.y - self.maxSpeed;
        }
        if (self.pressingDown) {
            self.y = self.y + self.maxSpeed;
        }
    }
    return self;
}

io.sockets.on('connection', (socket)=>{
    // console.log('socket connection');
    //socket.id = Math.random(); //might cause trouble with same id
    socket.id = numberCount;
    numberCount = numberCount + 1;
    socket.name = currentName;
    var player = Player(currentName);
    SOCKET_LIST[socket.id] = socket;
    PLAYER_LIST[socket.id] = player;

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });

    // code to send message
    socket.on('sendMsgToServer', function(data) {
        //console.log('hello');
        var name = data.name;
        var message = data.msg;
        var finalMessage = name + ": " + message;
        socket.broadcast.emit('addToChat', finalMessage);
        // for(var i in SOCKET_LIST) {
        //     SOCKET_LIST[i].emit('addToChat', finalMessage);
        // }
    });

    // broadcast user joined
    socket.on('new-user', name => {
        //console.log('hello');
        var finalMessage = name + " has join the game!";
        socket.broadcast.emit('addToChat', finalMessage);
    });

    socket.on('keyPress', function(data) {
        if (data.input === 'left') {
            player.pressingLeft = data.state;
        } else if (data.input === 'right') {
            player.pressingRight = data.state;
        } else if (data.input === 'up') {
            player.pressingUp = data.state;
        } else if (data.input === 'down') {
            player.pressingDown = data.state;
        }
    })
});

setInterval(() => {
    var pack = [];
    for(var i in PLAYER_LIST) {
        var player = PLAYER_LIST[i];
        player.updatePosition();
        pack.push({
            x:player.x,
            y:player.y,
            name: player.name
        })
        // added from for loop below
        // var socket = SOCKET_LIST[i];
        // socket.emit('newPositions', pack)
    }
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack)
    }
    
}, 1000/60);

module.exports = router

