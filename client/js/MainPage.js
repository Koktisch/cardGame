var partyStatusEnum = Object.freeze({ "public": 0, "private": 1, "full": 2 })

var socket = io();

var phoneModels = new RegExp('Android|webOS|iPhone|iPad|' +
    'BlackBerry|Windows Phone|' +
    'Opera Mini|IEMobile|Mobile',
    'i');

function sendMsg() {
    socket.emit('message', $('#txtInp').val());
    $('#txtInp').val('');
}

socket.on('message', function (msg) {
    $('#messages').append($('<li>').text(msg));
    $("html, body").scrollTop($(document).height());
});

getLobbysFromServer();

socket.on('addControlerResualt', function (data) {
    $('#controllerCode').css('display', 'none');
});

function getLobbysFromServer() {
    if (!phoneModels.test(navigator.userAgent)) {
        socket.emit('getPartyList');
        socket.on('partyList', function (data) {
            let gamesBox = document.getElementById("gamesBox");
            if (gamesBox.firstChild) {
                //usuwanie gameboxa
                while (gamesBox.firstChild) {
                    gamesBox.removeChild(gamesBox.firstChild);
                }
            }
            //wype³nianie game boxa
            for (var gameNum = 0; gameNum < data.length; gameNum++) {
                let div = document.createElement("div");
                let btn = document.createElement("button");
                if (data[gameNum].id === socket.id) {
                    btn.innerText = 'Wyjd¿ z pokoju';
                    btn.id = 'btnForLinked'
                    btn.onclick = function () { leaveLobby(); };
                }
                else {
                    btn.innerText = 'Do³¹cz go gry';
                    btn.onclick = function () { joinLobby(this); };
                }
                btn.id = data[gameNum].id;

                div.classList.add('gameDiv');
                div.id = data[gameNum].partyStatus + '?' + data[gameNum].id;
                div.innerHTML = 'Gra u¿ytkownika: ' + data[gameNum].firstPlayer.userName;
                div.appendChild(btn);
                document.getElementById("gamesBox").appendChild(div);
            }
        });
    }
}

function addPlayer() {
    socket.emit('addPlayer', {
        userName: document.getElementById('userName').value
    });

    socket.on('addPlayerResult', function (data) {
        if (data === false) {
            $('#logBox').css('display', 'none');
            $('.blockBox').css('display', 'none');
            getControllerCode();
        }
        else {
            alert('Nazwa ju¿ istnieje. Wybierz inn¹.');
        }
    });
}

function addGuest() {
    socket.emit('addGuest');
    socket.on('addPlayerResult', function (data) {
        if (data === false) {
            document.getElementsByClassName('blockBox')[0].style.display = "none";
            document.getElementById('logBox').style.display = "none";
        }
    });
}

function hostGame() {
    socket.emit('hostGame', {
        partyStatus: document.getElementById('partyStatus').selectedIndex,
        password: document.getElementById('password').value
    });
    startGame();
};

socket.on('startGame', function (data) {
    $('#board').css('display', 'block');
});

function joinLobby(e) {
    let statusStr = '';
    let idStr = '';
    statusStr = e.parentElement.id.charAt(0);
    idStr = e.parentElement.id.substring(2);
    if (statusStr == partyStatusEnum.private) {
        $('#passBox').css('display', 'block');
        $('#passBox').attr('value', idStr);
        startGame();
    }
    else {
        socket.emit('joinGame', { ID: idStr });
        startGame();
    }
};

function leaveLobby() {
    socket.emit('adminLeaveLobby', {});

    socket.on('adminLeaveLobbyResault', function (data) {
        if (data == true)
            getLobbysFromServer();
    });
};

function getControllerCode() {
    socket.emit('getControllerCode', {});

    socket.on('getControllerCodeRes', function (code) {
        $('#aForCode').html(code);
        $('#controllerCode').css('display', 'block');
    });
}

function checkPassword() {
    var isCorrect;
    socket.emit('checkPassword', {
        password: $('#pass-input').val(),
        id: $('#passBox').attr('value')
    });

    socket.on('checkPasswordResualt', function (data) {
        if (data.resualt) {
            joinLobby(id);
        }
        else {
            alert('Z³e has³o');
        }
    });

}

if (phoneModels.test(navigator.userAgent)) {
    $('#pc').css('display', 'none');
    $('#mobile').css('display', 'block');
    $('#logAbs').css('display', 'none');
    $('#connectController').css('display', 'block');

}
else {
    $('#pc').css('display', 'block');
    $('#mobile').css('display', 'none');
    $('#logAbs').css('display', 'block');
    $('#connectController').css('display', 'none');
}   