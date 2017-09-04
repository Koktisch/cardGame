socket.on('startGameBoard', function (startGameData) {
    $('#board').css('display', 'block');
    $('#priority').html(startGameData.startTxt);
    $('#ownhp').html(startGameData.ownHP);
    $('#enehp').html(startGameData.enemyHP);
    $('#priority').css('display', 'block');
    if (startGameData.start) {
        setTimeout(function () {
           socket.emit('timer');
        }, 80000);        
    }
});

socket.on('createBoard', function (board) {

    for (var i = 0; i < board.board.table.length; i++)
    {
        if (board.board.table[i] !== 'undefined')
        {
            var card = board.board.table[i].card;
            switch (board.board.table[i].owner) {
                case socket.id:
                    card.substr(0, 12) + board.board.table[i].position + ',' + card.substr(12);
                    $('#playerBoard').append(board.board.table[i].card);
                    break;

                default:
                    card.substr(0, 12) + board.board.table[i].position + ',' + card.substr(12);
                    $('#enemyPlayerBoard').append(board.board.table[i].card);                    
                    break;
            }
        }
    }
});

socket.on('timer', function (time)
{
    $('#timer').html(time.time);
    if (time.changeTurn)
    {
        socket.emit('changeTurn');
    }
});

socket.on('setTurn', function (turn) {
    $('#priority').html((turn.yourTurn == true ? 'Twój ruch' : 'Ruch przeciwnika'));
    setTimeout(function () {
        socket.emit('timer');
    }, 80000); 
});


socket.on('calculatedPoints', function (e) {
    $('#ownhp').html(e.ownHP);
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