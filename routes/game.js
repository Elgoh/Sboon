const express = require('express');
const app = express();
const router = express.Router();
// const { handleError, ErrorHandler } = require('../models/error');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);
// server.listen(process.env.PORT || 2000);
const server = require('../app');
const io = server.getIO();

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
        x:550,
        y:250,
        name: name,
        pressingRight: false,
        pressingLeft: false,
        pressingUp: false,
        pressingDown: false,
        maxSpeed: 10
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
io.sockets.on('connection', function(socket){
    console.log('socket connection');
    socket.id = Math.random()
    socket.name = currentName;
    var player = Player(currentName);
    SOCKET_LIST[socket.id] = socket;
    PLAYER_LIST[socket.id] = player;
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id]
        delete PLAYER_LIST[socket.id]
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
    }
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack)
    }
    
}, 30);

module.exports = router

