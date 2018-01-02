socket.on('startGameBoard', function (startGameData) {
    $('#board').css('display', 'block');
    $('#priority').html(startGameData.startTxt);
    $('#ownhp > .progress > .progress-bar').html(startGameData.ownHP);
    $('#enehp > .progress > .progress-bar').html(startGameData.enemyHP);
    $('#priority').css('display', 'block');

    $('#enehp > .progress > .progress-bar').css('width', '100%');
    $('#enehp > .progress > .progress-bar').text(15);

    $('#ownhp > .progress > .progress-bar').css('width', '100%');
    $('#ownhp > .progress > .progress-bar').text(15);
});

socket.on('createBoard', function (board) {
    
    $('#enemyCardBoard').empty();
    $('#ownCardBoard').empty();

    for (var i = 0; i < board.board.table.length; i++)
    {
        if (board.board.table[i] !== 'undefined'){
            var card = board.board.table[i].card;
            if (board.board.table[i].owner == socket.id) {
                $('#ownCardBoard').append(createCardBoard(card.ID, card.Cost, card.DmgValue, card.DefValue,
                    card.Image, card.isSpy, board.board.table[i].position));
            }
            else{
                $('#enemyCardBoard').append(createCardBoard(card.ID, card.Cost, card.DmgValue, card.DefValue,
                    card.Image, card.isSpy, board.board.table[i].position));              
            }
        }
    }
});

socket.on('enemyDisconectedBoard', function () {
    $('#error').val('Utracono po³¹czenie z przeciwnikiem');
    $('#ownCardBoard').empty();
    $('#enemyCardBoard').empty();
    $('#board').css('display', 'none');
}); 

socket.on('setTurn_Board', function (turn) { 
    $('#priority').html((turn.yourTurn == true ? 'Twoja tura' : 'Tura przeciwnika'));
});
socket.on('enemyDisconectedBoard', function () {
    $('#win').css('display', 'block');
    $('#blockEndGame').css('display', 'block');
    
});

socket.on('calculatedPoints', function (e) {
    if (e.yourHP >= 15) {
        $('#ownhp > .progress > .progress-bar').text(e.yourHP);
        $('#ownhp > .progress > .progress-bar').css('width', '100%');
    }
    else
    {
        $('#ownhp > .progress > .progress-bar').css('width', (100 - ((15 - e.yourHP) * 6.66)) + '%');
        $('#ownhp > .progress > .progress-bar').text(e.yourHP);
    }

    if (e.enemyHP >= 15) {
        $('#enehp > .progress > .progress-bar').text(e.enemyHP);
        $('#enehp > .progress > .progress-bar').css('width', '100%');
    }
    else {
        $('#enehp > .progress > .progress-bar').css('width', (100 - ((15 - e.enemyHP) * 6.66)) + '%');
        $('#enehp > .progress > .progress-bar').text(e.enemyHP);
    }

    if (e.passed || e.enemyHP <= 0 || e.yourHP <= 0)
    {
        if (e.yourHP > e.enemyHP) {
            $('#win').css('display', 'block');
            $('#blockEndGame').css('display', 'block');
        }
        else if (e.yourHP < e.enemyHP) {
            $('#lose').css('display', 'block');
            $('#blockEndGame').css('display', 'block');
        }
        else if (e.yourHP == e.enemyHP) {
            $('#draw').css('display', 'block');
            $('#blockEndGame').css('display', 'block');
        }
    }
});

socket.on('closeBoard', function () {

    $('#lose').html('display', 'none');
    $('#win').css('display', 'none');
    $('#draw').css('display', 'none');
    $('#board').css('display', 'none');
    $('#blockEndGame').css('display', 'none');
});

function disconnectBoard() {
    closeBoard();
}

function createCardBoard(id, cost, dmg, def, img, spy, position) {
    if (position == 'attack') {
        var innerTxt =
            '<div class="cardBoard ' + position + '" onclick="choseCard(this)"><div>' +
            '<img id="isSpy" src="client/img/Icons/Eye_open.png">' +
            '<img src="' + img + '" id="img">' +
            '<div class="name" id="IDS' + id + '">' + cardsName[id] + '</div> '+
            '<div id="val">' + dmg + '<img id="attackImg" src="client/img/Icons/attack.png"></div>';
    }
    else
    {
        var innerTxt =
            '<div class="cardBoard ' + position + '" onclick="choseCard(this)"><div>' +
            '<img id="isSpy" src="client/img/Icons/Eye_open.png">' +
            '<img src="' + img + '" id="img">' +
            '<div class="name" id="IDS' + id + '">' + cardsName[id] + '</div> ' +
            '<div id="val">' + def + '<img id="shieldImg" src="client/img/Icons/shield.png"></div>';
           
    }
    return innerTxt;
}

socket.on('enemyCloseBoard', function () {
    $('#blockEndGame').css('display', 'block');
    $('#win').css('display', 'block');
});

function closeBoard() {
    socket.emit('closedBoard', {});
    $('#blockEndGame').css('display', 'none');
    $('#ownCardBoard').empty();
    $('#enemyCardBoard').empty();
    $('#board').css('display', 'none');
} 

function winCloseBtn() {
    socket.emit('closeGame', {});
    $('#win').css('display', 'none');
    $('#blockEndGame').css('display', 'none');
    $('#ownCardBoard').empty();
    $('#enemyCardBoard').empty();
    $('#board').css('display', 'none');
}

function loseCloseBtn() {
    socket.emit('closeGame', {});
    $('#lose').css('display', 'none');
    $('#blockEndGame').css('display', 'none');
    $('#ownCardBoard').empty();
    $('#enemyCardBoard').empty();
    $('#board').css('display', 'none');
}

function drawCloseBtn() {
    socket.emit('closeGame', {});
    $('#draw').css('display', 'none');
    $('#blockEndGame').css('display', 'none');
    $('#ownCardBoard').empty();
    $('#enemyCardBoard').empty();
    $('#board').css('display', 'none');
}