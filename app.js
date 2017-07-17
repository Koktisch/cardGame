var express = require('express');
var app = express();
var serv = require('http').Server(app);
var hostGames = [];
var PLAYER_LIST = {};
var SOCKET_LIST = {};
var CONTROLERS_LIST = {};
var TABLE = {};

var $ = require('jquery');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started');

var cardType = Object.freeze({ "NoSpy": 0, "Spy": 1 })

var USER = function (data, user) {
    var user = {
        id: data.id,
        userName: user.userName,
        controller: null,
        host: null,
        board: null
    }
    user.setBoard = function (data) {
        user.board = SOCKET_LIST[data];
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

    user.setHost = function (hostId) {
        user.host = hostId;
    }

    return user;
}

var CONTROLLER = function (socketID)
{
    var controller = {
        userID: null,
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

    controller.setPlayer = function (userID) {
        controller.userID = userID;
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

    party.addSecondPlayer = function (player2) {
        party.secondPlayer = player2;
    }

    party.startGame = function () {
        SOCKET_LIST[party.firstPlayer.id].emit('startGame', { game: party });
        SOCKET_LIST[party.firstPlayer.controller.controllerID].emit('startGame', { game: party, deck: CARD().getDeck() });
        SOCKET_LIST[party.secondPlayer.id].emit('startGame', { game: party });
        SOCKET_LIST[party.secondPlayer.controller.controllerID].emit('startGame', { game: party, deck: CARD().getDeck() });
    }

    return party;
}

var mechanic = function () {

    mechanic.setTarget = function () {

    }

    mechanic.destroy = function () {

    }

    mechanic.setup = function () {

    }

    mechanic.moving = function () {

    }
}

var CARD = function () {

    var card = {
        Name: null,
        Value: null,
        Text: null,
        Ability: null,
        isSpy: null,
        Image: null,
        isLocked: false,
        createdBy: null,
        basicFunctions: mechanic
    }

    card.Cholera = function () {
        card.Name = 'Cholera';
        card.Value = 2;
        card.Text = 'Os³ab jednostkê o 1 co turê';
        card.isSpy = cardType.Spy;
        card.Image = '/img/cholera.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';
    }

    card.Mermaind = function () {
        card.Name = 'Syrena';
        card.Value = 4;
        card.Text = 'Przenieœ jedn¹ jednostkê na swoj¹ stronê';
        card.isSpy = cardType.NoSpy;
        card.Image = '/img/mermaid.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';
    }

    card.twilight_rider = function () {
        card.Name = 'Ksiê¿ycowy jeŸdziec';
        card.Value = 6;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = '/img/twilight_rider.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';
    }

    card.getDeck = function () {
        var deck = [];
        deck.push(card.Cholera());
        deck.push(card.Mermaind());
        deck.push(card.twilight_rider());

        return deck;
    }

    return card;
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
        emitLobbys();
    });

    function deleteHostedGame() {
        var deleted = false;
        var i = 0;
        do {
            if (hostGames.length != 0 && hostGames[i].id === socket.id) {
                hostGames.splice(i, 1);
                deleted = true;
            }
            i++;
        } while (deleted !== true);

        return deleted;
    };

    socket.on('getPartyList', function () {
        emitLobbys();
    });

    function emitLobbys() {
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('partyList', hostGames);
        }
    }

    //Hosting
    socket.on('hostGame', function (data) {
        console.log('Creating host');
        var goodName = true;
        var lobby = HOST(socket.id, PLAYER_LIST[socket.id], data);
        lobby.createParty();
        PLAYER_LIST[socket.id].setHost(socket.id);
        console.log(socket.id + '-' + 'USERNAME: ' + lobby.firstPlayer);
        emitLobbys();
    });

    socket.on('adminLeaveLobby', function (data) {
        socket.emit('adminLeaveLobbyResault', deleteHostedGame());
    });

    socket.on('joinGame', function (data) {
        for (var i = 0; i < hostGames.length; i++){
            if (hostGames[i] !== 'undefined' && hostGames[i].id === data.ID) {
                hostGames[i].addSecondPlayer(PLAYER_LIST[socket.id]);
                hostGames[i].startGame();
                break;
            }
        }
    });

    //Controller

    socket.on('getControllerCode', function (data) {
        var phoneController = CONTROLLER();
        phoneController.getCode();
        phoneController.setPlayer(socket.id);
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
        SOCKET_LIST[CONTROLERS_LIST[i].userID].emit('addControlerResualt', result);
       SOCKET_LIST[socket.id].emit('addControlerResualt', result);
    });

    //Password
    socket.on('checkPassword', function (data) {
        var isCorrect;
        for (var a = 0; a < hostGames.length; a++) {
            if (hostGames[a].id === data.id) {
                isCorrect = hostGames[a].password === data.password;
                break;
            }
        }
        socket.emit('checkPasswordResualt', {
            resualt: isCorrect,
            id: data.id
        });
    });

    //Chat
    socket.on('message', function (msg) {
        io.emit('message', PLAYER_LIST[socket.id].userName+': ' + msg);
    });

    //Game
    socket.on('setPriority', function (hostgame) {
        if (Math.random() > 0.5) {
            SOCKET_LIST[hostgame.firstPlayer.board.id].emit('setPriority', { starting: 'Zaczynasz' });
            SOCKET_LIST[hostgame.secondPlayer.board.id].emit('setPriority', { starting: 'Rozpoczyna przeciwnik' });
        }
        else {
            SOCKET_LIST[hostgame.firstPlayer.board.id].emit('setPriority', { starting: 'Rozpoczyna przeciwnik' });
            SOCKET_LIST[hostgame.secondPlayer.board.id].emit('setPriority', { starting: 'Zaczynasz' });
        }
    });


    //Board
    socket.on('setBoard', function (data) {
        PLAYER_LIST[data.playerId].setBoard(socket.id);
    });

});