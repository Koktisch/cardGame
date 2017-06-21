// JavaScript source code
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var hostGames = [];
var PLAYER_LIST = {};
var SOCKET_LIST = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started');


var USER = function (data, user) {
    var user = {
        id: data.id,
        userName: user.userName,
    }

    user.userExist = function () {
        var nameExist = false;
        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].userName === user.userName)
            {
                nameExist = true;
            }            
        }
        return nameExist;
    }

    return user;
}

var HOST = function (id, player, data) {
    var party = {
        id: id,
        firstPlayer: player,
        secondPlayer: null,
        partyStatus: data.partyStatus ,
        password: data.password
    }

    party.createParty = function () {
        console.log(party.id + ' - ' + party.firstPlayer);
        hostGames.push(party);
    }

    party.removeParty = function () {
        hostGames.pop(party);
    }

    return party;
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    SOCKET_LIST[socket.id] = socket;
    console.log('socket' + socket.id + ' connection');
    var player;

    socket.on('addPlayer', function (data) {
        var player = USER(socket, data);
        var result = player.userExist();  
        if (result != true) {
            PLAYER_LIST[socket.id] = player;
        }
        socket.emit('addPlayerResult', result);
    });

    socket.on('addGuest', function () {
        var guestName = { userName: 'Goœæ ' + socket.id.slice(1, 7) };
        var player = USER(socket, guestName);
        PLAYER_LIST[socket.id] = player;
        socket.emit('addPlayerResult', false);
    });

    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        
        console.log('disconect ' + socket.id);
    });

    socket.on('getPartyList', function () {
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('partyList', hostGames);
        }
    });

    socket.on('sendMsgToServer', function (data) {
        var playerName = PLAYER_LIST[socket.id];
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', playerName.userName + ': ' + data.msg);
        }
    });

    //Hosting
    socket.on('hostGame', function (data) {
        console.log('Creating host');
        var goodName = true;
        var lobby = HOST(socket.id, PLAYER_LIST[socket.id].userName, data);
        lobby.createParty();

        console.log(socket.id + '-' + 'USERNAME: ' + lobby.firstPlayer);
        for (var i in SOCKET_LIST) {
             SOCKET_LIST[i].emit('partyList', hostGames);
        }
    });

});