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


function createCard(id, name, cost, dmg, def, img, abillity, artist, spy, createdName) {
    var innerTxt =
        '<div class="card" onclick="choseCard(this)"><div id="inCard">' +
        '<div class="name" id="IDS' + id + '">' + name + '</div> ' +
        '<img id="isSpy" src="client/img/Icons/Eye_open.png">'+        
        '<img src="' + img + '" id="imgCard">' +
        '<div id="dmg"><img id="attackImg" src="client/img/Icons/attack.png"><div>' + dmg + '</div></div> ' +
        '<div id="created" href="' + artist + ' target="_blank">' + createdName + '</div>' + 
        '<div id="def"><img id="shieldImg" src="client/img/Icons/shield.png"><div>'+def+'</div></div></div></div>';

    return innerTxt;
}

function loadCards(cards) {
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        $('#boardLine').append(createCard(card.ID, card.Name, card.Cost, card.DmgValue, card.DefValue, card.Image, card.Ability, card.createdBy, card.isSpy, card.createdName));
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
        //todo inna blokada    
    }
    else
    {
        $('#atackPosition').css('display', 'none');
        $('#defensPosition').css('display', 'none');
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

