var startedTimer;
var smallTimer;

socket.on('startGameController', function (data) {
    $('.blockBox').css('display', 'none');
    $('#pass').css('display', 'none');
    if (data.deck !== 'undefined') {
        loadCards(data.deck);
    }
    if (data.start) {
        $('#opponentMove').text('Tura: Twoja');
        $('#opponentMove').attr('value', 'true');
        $('#pass').css('display', 'block');
        startedTimer = setTimeout(function () {
            timer(10);
        }, 60000);
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
        '<div id="created"><a>Artysta:</a><br><a>' + createdName + '</a></div>' + 
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
        if (sessionStorage.getItem('card') == null) 
        {
            sessionStorage.setItem('card', e.outerHTML);
            e.style.boxShadow = '5px 10px 50px';
            $('.positionButtons').css('display', 'block');
        }
        else if (sessionStorage.getItem('card') != e.outerHTML) {
            sessionStorage.removeItem('card');
            sessionStorage.setItem('card', e.outerHTML);
            $('.card').css('box-shadow', '')
            $('.positionButtons').css('display', 'block');
            e.style.boxShadow = '5px 10px 50px';
        }
    }
}

function setInPos(position)
{
    clearTimer();
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
    if ($('.card').length == 0)
        pass();
}


socket.on('setTurn_Controller', function (turn) {
    clearTimer();
    $('#pass').css('display', 'none');
    $('#board > .progress > .progress-bar').animate('');
    if (turn.yourTurn)
    {               
        startedTimer = setTimeout(function () {
            timer(11);
        }, 60000);

        $('#pass').css('display', 'block');
        if ($('#opponentMove').text() != 'Spasowano') {
            $('#opponentMove').text('Tura: Twoja');
            $('#opponentMove').attr('value', 'true');
        }
        sessionStorage.removeItem('card');
    }
    else
    {
        if ($('#opponentMove').text() != 'Spasowano') {
            $('#opponentMove').text('Tura: Przeciwnika');
            $('#opponentMove').attr('value', 'false');
            $('.card').css('boxShadow', '');
        }
        sessionStorage.removeItem('card');
    }   
    $('.positionButtons').css('display', 'none');
});

function timer(iteration) {
    smallTimer = setInterval(function () {           
        setSmallTimer(iteration);
        iteration--;
    }, 1000);
}

function setSmallTimer(iteration)
{    
    $('#pass > button > a').text(iteration);
    if (iteration == 0) {
        pass();
        clearInterval(smallTimer);
    }
}

function clearTimer() {
    clearTimeout(startedTimer);
    clearInterval(smallTimer);
    $('#pass > button > a').text('');
}

function pass()
{
    socket.emit('pass', {});
    $('#opponentMove').text('Spasowano');
    $('.card').css('boxShadow', '');
    $('#opponentMove').attr('value', 'Pass');
    $('#pass').css('display', 'none');
    $('.positionButtons').css('display', 'none');
    clearTimer();

}

socket.on('closeBoard', function () {
    $('#waitingBox').css('display', 'block');
    $('#resualt').css('display', 'none');
    $('#winController').css('display', 'none');
    $('#loseController').css('display', 'none');
    $('#drawController').css('display', 'none');
});

socket.on('enemyCloseBoard', function () {
    $('#boardLine').empty();
    $('#controlerBoard').css('display', 'none');
    $('#winController').css('display', 'none');
    $('#loseController').css('display', 'none');
    $('#drawController').css('display', 'none');
    $('#resualt').css('display', 'none');
    $('#waitingBox').css('display', 'block');
});

socket.on('enemyCloseBoard_Win', function () {
    $('#resualt').css('display', 'block');
    $('#boardLine').empty();
    $('#controlerBoard').css('display', 'none');
    $('#winController').css('display', 'block');
});

socket.on('showResualt', function (obj) {
    clearTimer();
    sessionStorage.removeItem('card');
    $('#pass').css('display', 'none');
    $('.positionButtons').css('display', 'none');
    $('#resualt').css('display', 'block'); 
    $('#boardLine').empty();
    $('#controlerBoard').css('display', 'none'); 
    if (obj.yourHP > obj.enemyHP)
        $('#winController').css('display', 'block');
    else if (obj.yourHP < obj.enemyHP)
        $('#loseController').css('display', 'block');
    else
        $('#drawController').css('display', 'block');
});

