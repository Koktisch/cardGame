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
        checkPassword(e.parentElement.children[0].value, idStr);
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