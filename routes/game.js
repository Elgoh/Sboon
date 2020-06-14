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
// const PLAYER_LIST = {};

// Gameboard
router.get('/gameboard', ensureAuthenticated, (req, res) => {
    currentName = req.user.name
    res.render('gameboard', {
        playerName: req.user.name,
        user: req.user
    })
});
var width = 25;
var height = 31;

var Entity = function(){
    var self = {
        x:375,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
        name:"",
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        // self.x += self.spdX;
        // self.y += self.spdY;
        //player width is 50
        //player height is 63
        
        if(self.spdX > 0) {
            if(!(self.x >= 750 - width)) {
                self.x += self.spdX;
            } 
            if(self.x <= 0 + width) {
                self.x += self.spdX;
            }
        } else {
            if(!(self.x <= 0 + width)) {
                self.x += self.spdX;
            }
            if(self.x >= 750 - width) {
                self.x += self.spdX;
            }
        }
        if(self.spdY > 0) {
            if(!(self.y >= 500 - height)) {
                self.y += self.spdY;
            } 
            if(self.y<= 0 + height) {
                self.y += self.spdY;
            }
        } else {
            if(!(self.y <= 0 + height)) {
                self.y += self.spdY;
            }
            if(self.y >= 500 - height) {
                self.y += self.spdY;
            }
        }
            

        // if(!(self.x < 0) && !(self.x > 750)) {
        //     self.x += self.spdX;
        // }
        // if(!(self.y < 0) && !(self.y > 500)) {
        //     self.y += self.spdY;
        // }
    }
    return self;
};

var Player = (name, id) => {
    var self = Entity();
        self.id = id;
        self.name = name;
        self.pressingRight = false;
        self.pressingLeft = false;
        self.pressingUp = false;
        self.pressingDown = false;
        self.maxSpd = 5;
        var super_update = self.update;

        self.update = function(){
            self.updateSpd();
            super_update();
        }

        self.updateSpd = function(){
            if(self.pressingRight) 
                self.spdX = self.maxSpd;
            else if(self.pressingLeft)
                self.spdX = -self.maxSpd;
            else
                self.spdX = 0;
           
            if(self.pressingUp)
                self.spdY = -self.maxSpd;
            else if(self.pressingDown)
                self.spdY = self.maxSpd;
            else
                self.spdY = 0;     
        }

        self.getInitPack = function() {
            return {
                id:self.id,
                x:self.x,
                y:self.y,	
                name:self.name,	
            };
        }

        self.getUpdatePack = function() {
            return {
                id:self.id,
                x:self.x,
                y:self.y,
            }
        }
        Player.list[id] = self;
        
        initPack.player.push(self.getInitPack());
        
        return self;
}

Player.list = {};

Player.onConnect = function(socket){
    socket.broadcast.emit('addToChat', socket.name + " has joined the game!"); // code to broadcast player joining the chat
    var player = Player(socket.name, socket.id);
    socket.on('keyPress',function(data){
        if(data.inputId === 'left') {
            player.pressingLeft = data.state;
        } else if(data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if(data.inputId === 'up'){
            player.pressingUp = data.state;
        } else if(data.inputId === 'down'){
            player.pressingDown = data.state;
        }  
    });       
    socket.emit('init',{
        selfId:socket.id,
        player:Player.getAllInitPack(),
    });
}

Player.getAllInitPack = function(){
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}

Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());    
    }
    return pack;
}

io.sockets.on('connection', (socket)=>{
    // console.log('socket connection');
    socket.id = Math.random(); //might cause trouble with same id
    // socket.id = numberCount;
    // numberCount = numberCount + 1;
    socket.name = currentName;
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);
    

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
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

    // // broadcast user joined
    // socket.on('new-user', name => {
    //     //console.log('hello');
    //     var finalMessage = name + " has join the game!";
    //     socket.broadcast.emit('addToChat', finalMessage);
    // });

});


var initPack = {player:[],};
var removePack = {player:[],};

setInterval(function(){
    var pack =  {
        player:Player.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
        //socket.emit('newPositions', pack);
    }
    initPack.player = [];
    removePack.player = [];
},1000/60);

module.exports = router