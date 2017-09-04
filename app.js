var express = require('express');
var app = express();
var serv = require('http').Server(app);
var HostGames_LIST = {};
var PLAYER_LIST = {};
var SOCKET_LIST = {};
var CONTROLERS_LIST = {};
var BOARDS_LIST = {};
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
        hp: 100,
        controller: null,
        host: null,
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

var BOARD = function (data) {
    var board = {
        host: data.id,
        table: [],
        ownHP: 100,
        enemyHP: 100
    }   

    board.addCard = function (card, player, position) {
        board.table.push({ card: card, owner: player, position: position });
    }


    return board;
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
        HostGames_LIST[party.id] = party;
    }

    party.removeParty = function () {
        delete HostGames_LIST[party.id];
    }

    party.addSecondPlayer = function (player2) {
        party.secondPlayer = player2;
    }

    party.startGame = function () {
        var deck = CARD().getDeck();
        if (Math.random() > 0.5) {
            SOCKET_LIST[party.secondPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Zaczynasz', start: true, ownHP: party.secondPlayer.hp, enemyHP: party.firstPlayer.hp });
            SOCKET_LIST[party.secondPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: true });
            SOCKET_LIST[party.firstPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Rozpoczyna przeciwnik', start: false, ownHP: party.firstPlayer.hp, enemyHP: party.secondPlayer.hp});
            SOCKET_LIST[party.firstPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: false });
        }
        else {
            SOCKET_LIST[party.firstPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Zaczynasz', start: true, ownHP: party.firstPlayer.hp, enemyHP: party.secondPlayer.hp });
            SOCKET_LIST[party.firstPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: true });
            SOCKET_LIST[party.secondPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Rozpoczyna przeciwnik', start: false, ownHP: party.secondPlayer.hp, enemyHP: party.firstPlayer.hp });
            SOCKET_LIST[party.secondPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: false });
        }

    }

    return party;
}

var CARD = function () {

    var card = {
        Name: null,
        Cost: null,
        DmgValue: null,
        DefValue: null,
        Text: null,
        Ability: null,
        isSpy: null,
        Image: null,
        isLocked: false,
        createdBy: null
    }

    card.Cholera = function () {
        card.Name = 'Cholera';
        card.Cost = 3;
        card.DmgValue = 2;
        card.DefValue = 8;
        card.Text = 'Os³ab jednostkê o 1 co turê';
        card.isSpy = cardType.Spy;
        card.Image = 'client/img/cholera.jpg';
        card.Ability = null;
        card.Function = '';
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }

    card.Mermaind = function () {
        card.Name = 'Syrena';
        card.Cost = 5;
        card.DmgValue = 4;
        card.DefValue = 5;
        card.Text = 'Przenieœ jedn¹ jednostkê na swoj¹ stronê';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/mermaid.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }

    card.twilight_rider = function () {
        card.Name = 'Ksiê¿ycowy jeŸdziec';
        card.Cost = 2;
        card.DmgValue = 6;
        card.DefValue = 3;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/twilight_rider.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
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
        var hostedGame = HostGames_LIST[socket.id];
        if (hostedGame != undefined)
            hostedGame.removeParty();
    };

    socket.on('getPartyList', function () {
        emitLobbys();
    });

    function emitLobbys() {
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('partyList', HostGames_LIST);
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
        for (var i in HostGames_LIST) {
            if (HostGames_LIST[i] !== 'undefined' && HostGames_LIST[i].id === data.ID) {
                HostGames_LIST[i].addSecondPlayer(PLAYER_LIST[socket.id]);
                PLAYER_LIST[socket.id].setHost(HostGames_LIST[i].id);
                HostGames_LIST[i].startGame();
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
                CONTROLERS_LIST[socket.id] = CONTROLERS_LIST[i];
                delete CONTROLERS_LIST[i];
                result = true;
                break;
            }
        }
        SOCKET_LIST[CONTROLERS_LIST[socket.id].userID].emit('addControlerResualt', result);
        SOCKET_LIST[socket.id].emit('addControlerResualt', result);
    });

    //Password
    socket.on('checkPassword', function (data) {
        var isCorrect;
        for (var a in HostGames_LIST) {
            if (HostGames_LIST[a].id === data.id) {
                isCorrect = HostGames_LIST[a].password === data.password;
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
        io.emit('message', PLAYER_LIST[socket.id].userName + ': ' + msg);
    });

    //Board
    socket.on('addCardToBoard', function (card) {
        var host = HostGames_LIST[PLAYER_LIST[CONTROLERS_LIST[socket.id].userID].host];
        var board = BOARD(host.id);
        board.addCard(card.card, host.firstPlayer.controllerID == socket.id ? host.firstPlayer.id : host.secondPlayer.id, card.position);
        BOARDS_LIST[host.id] = board;
        if (host !== 'undefined') {
            SOCKET_LIST[host.firstPlayer.id].emit('createBoard', { board: board });
            SOCKET_LIST[host.secondPlayer.id].emit('createBoard', { board: board });
            changeTurn(host, true);
        }

    });

    //Timer
    socket.on('timer', function () {
        var host = HostGames_LIST[PLAYER_LIST[socket.id].host];
        for (var i = 10; i >= 1; i--) {
            setTimeout(function () {
                SOCKET_LIST[host.firstPlayer.id].emit('timer', { time: i, changeTurn: (i == 1 ? true : false) });
                SOCKET_LIST[host.secondPlayer.id].emit('timer', { time: i, changeTurn: (i == 1 ? true : false) });
                if (i == 1) {
                    changeTurn(host, false);
                }
            }, 750);
        }
    });

    function changeTurn(host, bolVal) {

        if (bolVal)
        {
            SOCKET_LIST[host.firstPlayer.id].emit('setTurn', { yourTurn: (host.firstPlayer.controller.controllerID == socket.id ? false : true) });
            SOCKET_LIST[host.secondPlayer.id].emit('setTurn', { yourTurn: (host.secondPlayer.controller.controllerID == socket.id ? false : true) });
            SOCKET_LIST[host.firstPlayer.controller.controllerID].emit('setTurn', { yourTurn: (host.firstPlayer.controller.controllerID == socket.id ? false : true) });
            SOCKET_LIST[host.secondPlayer.controller.controllerID].emit('setTurn', { yourTurn: (host.secondPlayer.controller.controllerID == socket.id ? false : true) });       
        }
        else
        {
            SOCKET_LIST[host.firstPlayer.id].emit('setTurn', { yourTurn: (host.firstPlayer.id == socket.id ? false : true) });
            SOCKET_LIST[host.secondPlayer.id].emit('setTurn', { yourTurn: (host.secondPlayer.id == socket.id ? false : true) });
            SOCKET_LIST[host.firstPlayer.controller.controllerID].emit('setTurn', { yourTurn: (host.firstPlayer.id == socket.id ? false : true) });
            SOCKET_LIST[host.secondPlayer.controller.controllerID].emit('setTurn', { yourTurn: (host.secondPlayer.id == socket.id ? false : true) });
        }
    }


    function calculatePoints(host)
    { 
        var board = BOARDS_LIST[host.id].table;
        for (var i = 0; i < board.length; i++)
        {
            if (board[i].owner == host.firstPlayer.id)
            {
                if (board[i].position == 'attack')
                    board[i].enemyHP -= board[i].card.DmgValue;
                else
                    board[i].ownHP += board[i].card.DefValue;
            }
            else
            {
                if (board[i].position == 'attack')
                    board[i].ownHP -= board[i].card.DmgValue;
                else
                    board[i].enemyHP += board[i].card.DefValue;
            }
        }
        
        SOCKET_LIST[host.firstPlayer.id].emit('calculatedPoints', { yourHP: (board[i].ownHP > 100 ? 100 : board[i].ownHP), enemyHP: (board[i].enemyHP > 100 ? 100 : board[i].enemyHP) });
        SOCKET_LIST[host.secondPlayer.id].emit('calculatedPoints', { enemyHP: (board[i].ownHP > 100 ? 100 : board[i].ownHP), yourHP: (board[i].enemyHP > 100 ? 100 : board[i].enemyHP) });
    }

    socket.on('closeGame', function () {
        SOCKET_LIST[CONTROLERS_LIST[socket.id].userID].emit('closeBoard',{});
    });

});