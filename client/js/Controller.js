var phoneModels = new RegExp('Android|webOS|iPhone|iPad|' +
    'BlackBerry|Windows Phone|' +
    'Opera Mini|IEMobile|Mobile',
    'i');

if (phoneModels.test(navigator.userAgent)) {
    var host = JSON.parse(localStorage.getItem('hostID'));
    host = host.game;

    var playerId = localStorage.getItem('socketID');

    socket.emit('setBoard', { playerId: playerId });
    socket.emit('setPriority', { hostGame: host });

    socket.on('setPriority', function (data) {
        $('#priority').html(data.starting);
    });


    socket.on('startGame', function (data) {
        localStorage.setItem('hostGame', JSON.stringify(data));
        loadCards(data.deck);
    });


}

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

function createCard(name, value, img, abillity, artist, spy) {
    var innerTxt =
        '<div class="card" id="1card" onclick="' + +'">' +
        '<div id="name">' + value +
        '<div id="name">' + name +
        '</div> < div id="img" >' + img +
        '</div > <div id="ability">' + abillity +
        '</div> <div id="isSpy">' + spy +
        '</div> <div id="created">' + artist + '</div></div>';

    return innerTxt;
}

function loadCards(card) {
    for (var i = 0; i < card.lenght; i++) {
        var card = card[i];
        $('#controlerBoard').html(createCard(card.Name, card.Value, card.Image, card.Ability, card.createdBy, card.isSpy));
    }
}