var socket = io();

socket.on('startGame', function (data) {
    socket.emit('setPriority', { hostGame: host });
});

socket.on('setPriority', function (data) {
    $('#priority').html(data.starting);
});