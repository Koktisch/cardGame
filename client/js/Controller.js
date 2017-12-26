socket.on('startGameController', function (data) {
    localStorage.setItem('hostGame', JSON.stringify(data));
    $('.blockBox').css('display', 'none');
    if (data.deck !== 'undefined') {
        loadCards(data.deck);
    }
    if (data.start) {
        $('#opponentMove').text('Tura: Twoja');
        $('#opponentMove').attr('value', 'true');
    }
    else {
        $('#opponentMove').text('Tura: Przeciwnika');
        $('#opponentMove').attr('value', 'false');
    }
    $('#waiting').css('display', 'none');
});


function createCard(id, name, cost, dmg, def, img, abillity, artist, spy, createdName) {
    var innerTxt =
        '<div class="card" onclick="choseCard(this)"><div id="inCard">' +
        '<div class="name" id="IDS' + id + '">' + cardsName[id] + '</div> ' +
        '<img id="isSpy" src="client/img/Icons/Eye_open.png">'+        
        '<img src="' + img + '" id="imgCard">' +
        '<div id="dmg"><img id="attackImg" src="client/img/Icons/attack.png"><div>' + dmg + '</div></div> ' +
        '<div id="created"><a>Artysta:</a><br><a href="' + artist + ' target="_blank">' + createdName + '</a></div>' + 
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
    if ($('#opponentMove').attr('value') == 'true')
    {
        if (sessionStorage.getItem('card') != e.outerHTML) {
            sessionStorage.setItem('card', e.outerHTML);
            $('.positionButtons').css('display', 'block');
        }
        else {
            sessionStorage.removeItem('card');
            $('.positionButtons').css('display', 'none');
        }
    }
}

function setInPos(position)
{
    var i = 1;
    var card = sessionStorage.getItem('card');
    var idNumber = "";
    socket.emit('addCardToBoard', {
        card: card,
        position: position,
        haveAnyCard: $('#boardLine').children().length != 0
    });
    while ($.isNumeric(card[card.search('IDS') + 2 + i]))
    {
        idNumber += card[card.search('IDS') + 2 + i];
        i++;
    }
    $('#IDS' + idNumber).parent().parent().remove();
}


socket.on('setTurn_Controller', function (turn) {
    if (turn.yourTurn)
    {       
        $('#opponentMove').text('Tura: Twoja');  
        $('#opponentMove').attr('value', 'true');
        sessionStorage.removeItem('card');
    }
    else
    {
        $('#opponentMove').text('Tura: Przeciwnika');
        $('#opponentMove').attr('value', 'false');
        sessionStorage.removeItem('card');
    }   
    $('.positionButtons').css('display', 'none');
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

