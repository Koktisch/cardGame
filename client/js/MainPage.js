socket.on('message', function (msg) {
    $('#messages').append($('<li>').text(msg));
    $("html, body").scrollTop($(document).height());
});

getLobbysFromServer();

socket.on('addControlerResualt_MP', function (data) {
    $('#controllerCode').css('display', 'none');
});

function pageStarted()
{
    setDivs();
    getLobbysFromServer();
    
}
getUsers();
function getUsers()
{
    socket.emit('getUsers');
    socket.on('userList', function (data) {
        let playerBox = $('#playersOnPage');
        if (playerBox[0].firstChild) {
            while (playerBox[0].firstChild) {
                playerBox[0].removeChild(playerBox[0].firstChild);
            }
        }
        for (var player in data) {
            let div = document.createElement("p");    
            div.classList.add('playerList');
            div.innerHTML = data[player].userName;
            playerBox[0].appendChild(div);
        }
    });
}

function setDivs()
{
    if (phoneModels.test(navigator.userAgent)) {
        $('#pc').css('display', 'none');
        $('#mobile').css('display', 'block');

    }
    else {
        $('#pc').css('display', 'block');
        $('#mobile').css('display', 'none');
    }
}

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
            //wype�nianie game boxa
            for (var gameNum in data) {
                if (data[gameNum].partyStatus != 2)
                {
                    let div = document.createElement("div");
                    let btn = document.createElement("button");
                    btn.classList.add("btn");
                    btn.classList.add("btn-default");
                    btn.style = "height: 100%;float: right;";
                    if (data[gameNum].id === socket.id) {
                        btn.innerText = 'Wyjd�';
                        btn.id = 'btnForLinked'
                        btn.onclick = function () { leaveLobby(); };
                    }
                    else {
                        btn.innerText = 'Do��cz';
                        btn.onclick = function () { joinLobby(this); };
                    }
                    btn.id = data[gameNum].id;

                    div.classList.add('gameDiv');
                    div.id = data[gameNum].partyStatus + '?' + data[gameNum].id;
                    if (data[gameNum].roomName != '')
                        div.innerHTML = data[gameNum].roomName;
                    else
                        div.innerHTML = 'Gra u�ytkownika: ' + data[gameNum].firstPlayer.userName;
                    div.appendChild(btn);
                    document.getElementById("gamesBox").appendChild(div);
                }
            }
        });
    }
}

function addPlayer() {
    if ($('#userName').val()) {
        socket.emit('addPlayer', {
            userName: $('#userName').val()
        });
    }
    else
    {
        $('#errorPc').val('Nazwij si� :)')
    }
    socket.on('addPlayerResult', function (data) {
        if (data === false) {
            $('#logBox').css('display', 'none');
            getControllerCode();
            getUsers();
        }
        else {
            alert('Nazwa jest ju� u�ywana. Wybierz inn�.');
        }
    });
}

function hostGame() {
    if ($('#partyStatus')[0].selectedIndex == 1 && $('#password')[0].value == '') {
        $('#Alert-EmptyPassword').show();
    }
    else {
        socket.emit('hostGame', {
            hostName: $('#hostName').val(),
            partyStatus: document.getElementById('partyStatus').selectedIndex,
            password: document.getElementById('password').value
        })
    };
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
    }
    else {
        socket.emit('joinGame', { ID: idStr });
    }
};

function leaveLobby() {
    socket.emit('adminLeaveLobby', {});

    socket.on('adminLeaveLobbyResault', function (data) {
        getLobbysFromServer();
    });
};

function getControllerCode() {
    socket.emit('getControllerCode', {});

    socket.on('getControllerCodeRes', function (code) {
        $('#code').html(code);
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
            alert('Z�e has�o');
        }
    });

}