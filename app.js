// JavaScript source code
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var hostGames = [];
var PLAYER_LIST = {};
var SOCKET_LIST = {};
var CONTROLERS_LIST = {};

var $ = require('jquery');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started');



var USER = function (data, user, controller) {
    var user = {
        id: data.id,
        userName: user.userName,
        controller: controller,
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

    user.setController = function (controllerObj) {
        user.controller = controllerObj;
    }

    return user;
}

var controller = function (socketID)
{
    var controller = {
        controllerID: socketID,
        syncCode: null 
    }

    controller.getCode = function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        controller.syncCode = text;
        return text;
    }

    return controller;
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
        deleteHostedGame();
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];        
        
        console.log('disconect ' + socket.id);
    });

    function deleteHostedGame() {
        var deleted = false;
        var i = 0;
        do {
            if (hostGames[i] !== 'undefined' && hostGames[i].id === socket.id) {
                hostGames.splice(i,1);
                deleted = true;
            }
            i++;
        } while (deleted !== true);

        return deleted;
    };

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

    socket.on('adminLeaveLobby', function (data) {
        socket.emit('adminLeaveLobbyResault', deleteHostedGame());
    });


    //Controller

    socket.on('getControllerCode', function (data) {
        var phoneController = controller();
        phoneController.getCode();
        CONTROLERS_LIST[socket.id] = phoneController;
        PLAYER_LIST[socket.id].setController(phoneController);
        socket.emit('getControllerCodeRes', phoneController.syncCode);
    });
    socket.on('addControler', function (data) {
        var result = false;
        for (var i in CONTROLERS_LIST) {
            if (data.codeValue == CONTROLERS_LIST[i].syncCode) {
                CONTROLERS_LIST[i].controllerID = socket.id;
                result = true;
                break;
            }   
        }        
        socket.emit('addControlerResualt', result);
    });

});