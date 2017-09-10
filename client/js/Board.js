var stTimer;

socket.on('startGameBoard', function (startGameData) {
    $('#board').css('display', 'block');
    $('#priority').html(startGameData.startTxt);
    $('#ownhp').html(startGameData.ownHP);
    $('#enehp').html(startGameData.enemyHP);
    $('#priority').css('display', 'block');
    if (startGameData.start) {
        stTimer = setTimeout(function () {
           socket.emit('timer');
        }, 80000);        
    }
});

socket.on('createBoard', function (board) {
    
    $('#playerBoard').empty();
    $('#enemyPlayerBoard').empty();

    for (var i = 0; i < board.board.table.length; i++)
    {
        if (board.board.table[i] !== 'undefined'){
            var card = board.board.table[i].card;
            if (board.board.table[i].owner == socket.id) {
                $('#playerBoard').append(createCard(card.ID, card.Name, card.Cost, card.DmgValue, card.DefValue,
                    card.Image, card.Ability, card.createdBy, card.isSpy, board.board.table[i].position));
            }
            else{
                $('#enemyPlayerBoard').append(createCard(card.ID, card.Name, card.Cost, card.DmgValue, card.DefValue,
                    card.Image, card.Ability, card.createdBy, card.isSpy, board.board.table[i].position));              
            }
        }
    }
});

socket.on('timer', function (time)
{
    $('#timer').html(time.time);
    if ($('#timer').attr('display') == 'none') {
        $('#timer').css('disply', 'block');
    }    
    if (time.changeTurn)
    {   
        $('#timer').css('disply', 'none');
        socket.emit('changeTurn');
    }
});

socket.on('setTurn', function (turn) {
    clearTimeout(stTimer);
    $('#priority').html((turn.yourTurn == true ? 'Twój ruch' : 'Ruch przeciwnika'));
    stTimer = setTimeout(function () {
        socket.emit('timer');
    }, 80000); 
});


socket.on('calculatedPoints', function (e) {
    $('#ownhp').html(e.yourHP);
    $('#enehp').html(e.enemyHP);

    if (e.ownHP < 0)
    {
        $('#win').css('display', 'block');
    }
    else if (e.enemyHP < 0)
    {
        $('#lose').html('display', 'block');
    }
});

socket.on('closeBoard', function () {

    $('#lose').html('display', 'none');
    $('#win').css('display', 'none');
    $('#board').css('display', 'none');
});

function createCard(id, name, cost, dmg, def, img, abillity, artist, spy, position) {
    var innerTxt =
        '<div class="card,'+ position +'" onclick="choseCard(this)"><div>' +
        '<div id="isSpy">' + spy + '</div>' +
        '<div class="name" id="IDS' + id + '">' + name + '</div> ' +
        '<img src="' + img + '" id="img">' +
        '<div id="ability">' + abillity + '</div>' +
        '<div id="dmg">' + dmg + '</div> ' +
        '<div id="def">' + def + '</div> ' +
        '<a id="created" href="' + artist + '"></a> </div></div>';

    return innerTxt;
}