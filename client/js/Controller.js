socket.on('startGameController', function (data) {
    localStorage.setItem('hostGame', JSON.stringify(data));
    if (data.deck !== 'undefined') {
        loadCards(data.deck);
    }
    if (data.start) {
        $('.blockBox').css('display', 'none');
        $('#opponentMove').css('display', 'none');
    }
    else {
        $('.blockBox').css('display', 'block');
        $('#opponentMove').css('display', 'block');
    }
    $('#waiting').css('display', 'none');
});

function addControler() {
    socket.emit('addControler', {
        codeValue: $('#controlerCode').val(),
        socketID: localStorage.getItem('socketID')
    });

    socket.on('addControlerResualt', function (data) {
        if (data === true) {
            $('#waiting').css('display', 'block');
            $('#connectController').css('display', 'none');
        }
        else {
            $('#error').html('B³¹d po³¹czenia kontrolera!');
        }
    });
}

function createCard(name, cost, dmg, def, img, abillity, artist, spy) {
    var innerTxt =
        '<div class="card" onclick="choseCard(this)"><div>' +
        '<div id="cost">' + cost + '</div> ' +
        '<div id="isSpy">' + spy + '</div>' +
        '<div id="name">' + name + '</div> ' +
        '<img src="' + img +'" id="img">' +
        '<div id="ability">' + abillity + '</div>' +
        '<div id="dmg">' + dmg + '</div> ' +
        '<div id="def">' + def + '</div> ' +        
        '<a id="created" href="' + artist +'"></a> </div></div>';

    return innerTxt;
}

function loadCards(card) {
    for (var i = 0; i < card.length; i++) {
        var card = card[i];
        $('#controlerBoard').html(createCard(card.Name, card.Cost, card.DmgValue, card.DefValue, card.Image, card.Ability, card.createdBy, card.isSpy));
    }
    $('#controlerBoard').css('display', 'block');
}

function choseCard(e)
{
    if (sessionStorage.getItem('card') != e.outerHTML) {
        sessionStorage.setItem('card', e.outerHTML);
        $('#atackPosition').css('display', 'block');
        $('#defensPosition').css('display', 'block');
    }
    else {
        sessionStorage.removeItem('card');
        $('#atackPosition').css('display', 'none');
        $('#defensPosition').css('display', 'none');
    }
}

function setInPos(position)
{
    var card = sessionStorage.getItem('card');
    socket.emit('addCardToBoard', {
        card: card,
        position: position
    });
}


socket.on('setTurn', function (turn) {
    if (turn.yourTurn)
    {
        $('.blockBox').css('display', 'none');

    }
    else
    {
        $('.blockBox').css('display', 'block');
        $('#opponentMove').css('display', 'block');
    }    
});

function closeBoard()
{
    socket.emit('closeGame', {});
}

