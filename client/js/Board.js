var socket = io();

var host = JSON.parse(localStorage.getItem('hostID'));
host = host.game;

var playerId = localStorage.getItem('socketID');

socket.emit('setBoard', { playerId: playerId });
socket.emit('setPriority', { hostGame: host });

socket.on('setPriority', function (data) {
    $('#priority').html(data.starting);
});