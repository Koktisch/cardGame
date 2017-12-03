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


function createCard(id, name, cost, dmg, def, img, abillity, artist, spy) {
    var innerTxt =
        '<div class="card" onclick="choseCard(this)"><div>' +
        '<div id="isSpy">' + spy + '</div>' +
        '<div class="name" id="IDS' + id +'">' + name + '</div> ' +
        '<img src="' + img +'" id="img">' +
        '<div id="ability">' + abillity + '</div>' +
        '<div id="dmg">' + dmg + '</div> ' +
        '<div id="def">' + def + '</div> ' +        
        '<a id="created" href="' + artist +'"></a> </div></div>';

    return innerTxt;
}

function loadCards(cards) {
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        $('#controlerBoard').append(createCard(card.ID, card.Name, card.Cost, card.DmgValue, card.DefValue, card.Image, card.Ability, card.createdBy, card.isSpy));
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


socket.on('setTurn_Controller', function (turn) {
    if (turn.yourTurn)
    {
        $('.blockBox').css('display', 'none');

    }
    else
    {
        $('#atackPosition').css('display', 'none');
        $('#defensPosition').css('display', 'none');
        $('.blockBox').css('display', 'block');
        $('#opponentMove').css('display', 'block');
    }    
});

function closeBoard()
{
    $('#closeGame').css('display', 'block');
    socket.emit('closeGame', {});
}

socket.on('enemyDisconectedController', function (obj) {
    if (obj.val) {
        $('#controlerBoard').empty();
        $('#controlerBoard').css('display', 'none');
        $('#waiting').css('display', 'block');        
        $('.blockBox').css('display', 'block');
    }
    else
    {
        window.open('', '_parent', '');
        window.close();
    }
});

