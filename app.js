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

function timer(i, host) {
    i--;
    SOCKET_LIST[host.firstPlayer.id].emit('timer', { time: i, changeTurn: (i == 0 ? true : false) });
    SOCKET_LIST[host.secondPlayer.id].emit('timer', { time: i, changeTurn: (i == 0 ? true : false) });
    if (i == 0) {
        host.clearTimer();
        changeTurn(host);
    }
    else {
        setTimeout(function () { timer(i, host); }, 1000);
    }

}

function changeTurn(host) {
    if (host.playerTurn == host.firstPlayer.id) {
        host.setPlayerTurn(host.secondPlayer.id);

        SOCKET_LIST[host.firstPlayer.id].emit('setTurn_Board', { yourTurn: true });
        SOCKET_LIST[host.secondPlayer.id].emit('setTurn_Board', { yourTurn: false });
        SOCKET_LIST[host.firstPlayer.controller.controllerID].emit('setTurn_Controller', { yourTurn: true });
        SOCKET_LIST[host.secondPlayer.controller.controllerID].emit('setTurn_Controller', { yourTurn: false });

    }
    else if (host.playerTurn == host.secondPlayer.id) {
        host.setPlayerTurn(host.firstPlayer.id);
        SOCKET_LIST[host.firstPlayer.id].emit('setTurn_Board', { yourTurn: false });
        SOCKET_LIST[host.secondPlayer.id].emit('setTurn_Board', { yourTurn: true });
        SOCKET_LIST[host.firstPlayer.controller.controllerID].emit('setTurn_Controller', { yourTurn: false });
        SOCKET_LIST[host.secondPlayer.controller.controllerID].emit('setTurn_Controller', { yourTurn: true });

    }

    host.setTimer();
}

var cardType = Object.freeze({ "NoSpy": 0, "Spy": 1 })

var USER = function (data, user) {
    var user = {
        id: data.id,
        userName: user.userName,
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
        host: data,
        table: [],
        ownHP: 15,
        enemyHP: 15
    }   

    board.addCard = function (card, player, position) {
        var pos = card.indexOf('"', card.indexOf('IDS'));
        var name = card.substring(card.indexOf('IDS') + 3, pos);
        var cardObj = CARD().findObject(name);
        board.table.push({ card: cardObj, owner: player, position: position });
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
        roomName: data.hostName,
        firstPlayer: player,
        secondPlayer: null,
        board: null,
        partyStatus: data.partyStatus ,
        password: data.password,
        playerTurn: null,
        timer: null
    }

    party.createParty = function () {
        console.log(party.id + ' - ' + party.firstPlayer);
        HostGames_LIST[party.id] = party;
    }

    party.setTimer = function () {
        party.timer = setTimeout(function () {
            timer(11, party);
        }, 80000);
    }

    party.clearTimer = function () {
        clearTimeout(party.timer);
    }

    party.removeParty = function () {
        delete HostGames_LIST[party.id];
    }

    party.addSecondPlayer = function (player2) {
        party.secondPlayer = player2;
    }

    party.setPlayerTurn = function (playerName) {
        party.playerTurn = playerName;
    }

    party.addBoard = function (board) {
        party.board = board;
    }

    party.startGame = function () {
        var deck = [CARD().Cholera(), CARD().Mermaind(), CARD().Twilight_rider(), CARD().belobog(), CARD().chernobog(),
            CARD().moranaSpring(), CARD().moranaWinter(), CARD().zlata_maja()];

        if (Math.random() > 0.5) {

            if (!party.playerTurn) 
                party.setPlayerTurn(party.firstPlayer.id);                
            
            SOCKET_LIST[party.secondPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Zaczynasz', start: true, ownHP: party.board.ownHP, enemyHP: party.board.enemyHP });
            SOCKET_LIST[party.secondPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: true });
            SOCKET_LIST[party.firstPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Rozpoczyna przeciwnik', start: false, ownHP: party.board.ownHP, enemyHP: party.board.enemyHP});
            SOCKET_LIST[party.firstPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: false });
        }
        else {

            if (!party.playerTurn)
                party.setPlayerTurn(party.secondPlayer.id);

            SOCKET_LIST[party.firstPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Zaczynasz', start: true, ownHP: party.board.ownHP, enemyHP: party.board.enemyHP });
            SOCKET_LIST[party.firstPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: true });
            SOCKET_LIST[party.secondPlayer.id].emit('startGameBoard', { game: party, startTxt: 'Rozpoczyna przeciwnik', start: false, ownHP: party.board.ownHP, enemyHP: party.board.enemyHP });
            SOCKET_LIST[party.secondPlayer.controller.controllerID].emit('startGameController', { game: party, deck: deck, start: false });
        }

    }

    return party;
}

var CARD = function () {

    var card = {
        Name: null,
        DmgValue: null,
        DefValue: null,
        Text: null,
        Ability: null,
        isSpy: null,
        Image: null,
        isLocked: false,
        createdBy: null
    }

    card.findObject = function (objName) {
        switch (parseInt(objName))
        {
            case 1:
                return card.Cholera();

            case 2:
                return card.Mermaind();

            case 3:
                return card.Twilight_rider();

            case 4:
                return card.belobog();

            case 5:
                return card.chernobog();

            case 6:
                return card.domovoi();

            case 7:
                return card.hybrid();

            case 8:
                return card.moranaSpring();

            case 9:
                return card.moranaWinter();

            case 10:
                return card.volkolak();

            case 11:
                return card.vuzhalka();

            case 12:
                return card.zlata_maja();

            case 13:
                return card.zmey_gorynych();
        }
    }

    card.Cholera = function () {
        card.ID = 1;
        card.Name = 'Cholera';
        card.DmgValue = 2;
        card.DefValue = 8;
        card.Text = 'Os³ab jednostkê o 1 co turê';
        card.isSpy = cardType.Spy;
        card.Image = 'client/img/cholera.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }

    card.Mermaind = function () {
        card.ID = 2;
        card.Name = 'Syrena';
        card.DmgValue = 4;
        card.DefValue = 5;
        card.Text = 'Przenieœ jedn¹ jednostkê na swoj¹ stronê';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/mermaid.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }

    card.Twilight_rider = function () {
        card.ID = 3;
        card.Name = 'Ksiê¿ycowy jeŸdziec';
        card.DmgValue = 6;
        card.DefValue = 3;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/twilight_rider.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }    

    card.belobog = function () {
        card.ID = 4;
        card.Name = 'Belobog';
        card.DmgValue = 2;
        card.DefValue = 7;
        card.Text = '';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/belobog.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }    

    card.chernobog = function () {
        card.ID = 5;
        card.Name = 'Chernobog';
        card.DmgValue = 7;
        card.DefValue = 2;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/chernobog.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }    

    card.domovoi = function () {
        card.ID = 6;
        card.Name = 'Domovov';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/domovoi.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }    

    card.hybrid = function () {
        card.ID = 7;
        card.Name = 'Hybrid';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/hybrid.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }  

    card.moranaSpring = function () {
        card.ID = 8;
        card.Name = 'Morana: Wiosna';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/moranaSpring.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }  

    card.moranaWinter = function () {
        card.ID = 9;
        card.Name = 'Morana: Zima';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/moranaWinter.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }  

    card.volkolak = function () {
        card.ID = 10;
        card.Name = 'Wi³ko³ak';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/volkolak.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }  


    card.vuzhalka = function () {
        card.ID = 11;
        card.Name = 'Vuzhalka';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/vuzhalka.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }  

    card.zlata_maja = function () {
        card.ID = 12;
        card.Name = 'zlata_maja';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/zlata_maja.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
    }  

    card.zmey_gorynych = function () {
        card.ID = 13;
        card.Name = 'zmey_gorynych';
        card.DmgValue = 4;
        card.DefValue = 4;
        card.Text = 'Zablokuj umiejêtnoœæ jednej jednostki';
        card.isSpy = cardType.NoSpy;
        card.Image = 'client/img/zmey_gorynych.jpg';
        card.Ability = null;
        card.createdBy = 'https://vasylina.deviantart.com/';

        return card;
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
        removeGame();
        deleteHostedGame();
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        emitLobbys();
        emitPlayers();
    });

    function deleteHostedGame() {
        var hostedGame = HostGames_LIST[socket.id];
        if (hostedGame != undefined)
            hostedGame.removeParty();
    };

    function removeGame() {
        if (PLAYER_LIST[socket.id] !== undefined && HostGames_LIST[PLAYER_LIST[socket.id].host] !== undefined)
        {
            if (HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.id === socket.id)
            {
                HostGames_LIST[PLAYER_LIST[socket.id].host].clearTimer();
                if (HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer != null)
                {
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.id].emit('enemyDisconectedBoard', {});
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.controller.controllerID].emit('enemyDisconectedController', { val: true });
                }
                if (SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID] != null)
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID].emit('enemyDisconectedController', { val: false });
                delete CONTROLERS_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID];
                delete HostGames_LIST[PLAYER_LIST[socket.id].host];
               
            }
            else {
                HostGames_LIST[PLAYER_LIST[socket.id].host].clearTimer();
                if (HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer != null) {
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.id].emit('enemyDisconectedBoard', {});
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID].emit('enemyDisconectedController', { val: true });
                }
                SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.controller.controllerID].emit('enemyDisconectedController', { val: false });
                delete CONTROLERS_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.controller.controllerID];
                delete HostGames_LIST[PLAYER_LIST[socket.id].host];
            }

            if (HostGames_LIST[PLAYER_LIST[socket.id].host] != undefined) {
                if (HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID === socket.id) {
                    HostGames_LIST[PLAYER_LIST[socket.id].host].clearTimer();
                    if (HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.id != null) {
                        SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.id].emit('enemyDisconectedBoard', {});
                        SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.controller.controllerID].emit('enemyDisconectedController', { val: true });
                    }
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.id].emit('enemyDisconectedBoard', {});
                    //todo przekazanie roz³aczenia kontrolera
                    delete CONTROLERS_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID];
                    delete HostGames_LIST[PLAYER_LIST[socket.id].host];

                }
                else {
                    HostGames_LIST[PLAYER_LIST[socket.id].host].clearTimer();
                    if (HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.id != null) {
                        SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.id].emit('enemyDisconectedBoard', {});
                        SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].firstPlayer.controller.controllerID].emit('enemyDisconectedController', { val: true });
                    }
                    SOCKET_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.id].emit('enemyDisconectedBoard', {});
                    //todo przekazanie roz³aczenia kontrolera
                    delete CONTROLERS_LIST[HostGames_LIST[PLAYER_LIST[socket.id].host].secondPlayer.controller.controllerID];
                    delete HostGames_LIST[PLAYER_LIST[socket.id].host];
                }
            }
        }
    };

    socket.on('getPartyList', function () {
        emitLobbys();
    });

    function emitLobbys() {
        for (var i in PLAYER_LIST) {
            SOCKET_LIST[i].emit('partyList', HostGames_LIST);
        }
    }

    socket.on('getUsers', function () {
        emitPlayers();
    });

    function emitPlayers() {
        for (var i in PLAYER_LIST) {
            SOCKET_LIST[i].emit('userList', PLAYER_LIST);
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
                HostGames_LIST[i].partyStatus = 2;
                PLAYER_LIST[socket.id].setHost(HostGames_LIST[i].id);
                BOARDS_LIST[socket.id] = BOARD(socket.id);
                HostGames_LIST[i].addBoard(BOARDS_LIST[socket.id]);
                HostGames_LIST[i].startGame();
                emitLobbys();
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
                if (Object.is(CONTROLERS_LIST[socket.id], CONTROLERS_LIST[i]))
                    delete CONTROLERS_LIST[i];
                result = true;
                break;
            }
        }
        if (result) {
            SOCKET_LIST[CONTROLERS_LIST[socket.id].userID].emit('addControlerResualt_MP', result);
            SOCKET_LIST[socket.id].emit('addControlerResualt_CN', result);
        }
        else {
            SOCKET_LIST[socket.id].emit('addControlerResualt_CN', result);
        }
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
    //if (PLAYER_LIST[socket.id] != undefined) {
        socket.on('message', function (msg) {
            if (msg != '')
             io.emit('message', PLAYER_LIST[socket.id].userName + ': ' + msg);
        });
   // }

    //Board
    socket.on('addCardToBoard', function (card) {
        var host = HostGames_LIST[PLAYER_LIST[CONTROLERS_LIST[socket.id].userID].host];
        var board = BOARDS_LIST[host.board.host];
        board.addCard(card.card, host.firstPlayer.controller.controllerID == socket.id ? host.firstPlayer.id : host.secondPlayer.id, card.position);
        BOARDS_LIST[host.firstPlayer.id] = board;

        if (host !== 'undefined') {            
            SOCKET_LIST[host.firstPlayer.id].emit('createBoard', { board: board });
            SOCKET_LIST[host.secondPlayer.id].emit('createBoard', { board: board });
            calculatePoints(host);
            host.clearTimer();
            changeTurn(host);
        }

    });

    //Timer
    socket.on('timer', function () {
        if (PLAYER_LIST[socket.id] !== 'undefined') {
            var host = HostGames_LIST[PLAYER_LIST[socket.id].host];            
            host.setTimer();
        }
    });

    function calculatePoints(host)
    { 
        var board = BOARDS_LIST[host.id];
        var enHP = 15;
        var onHP = 15;
        for (var i = 0; i < board.table.length; i++)
        {
            if (board.table[i].owner == host.firstPlayer.id)
            {
                if (board.table[i].position == 'attack')
                    enHP = board.enemyHP - board.table[i].card.DmgValue;
                else
                    onHP = board.ownHP + board.table[i].card.DefValue;
            }
            else
            {
                if (board.table[i].position == 'attack')
                    onHP = board.ownHP - board.table[i].card.DmgValue;
                else
                    enHP = board.enemyHP + board.table[i].card.DefValue;
            }
        }
        
        SOCKET_LIST[host.firstPlayer.id].emit('calculatedPoints', { yourHP: (onHP > 15 ? board.ownHP : onHP), enemyHP: (enHP > 15 ? board.enemyHP : enHP) });
        SOCKET_LIST[host.secondPlayer.id].emit('calculatedPoints', { enemyHP: (onHP > 15 ? board.ownHP : onHP), yourHP: (enHP > 15 ? board.enemyHP : enHP) });
    }

    socket.on('closeGame', function () {
        SOCKET_LIST[CONTROLERS_LIST[socket.id].userID].emit('closeBoard',{});
    });

});