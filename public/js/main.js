var socket = require('socket.io-client')();
var $ = require('jquery')

$('#sendForm').submit(function(){
    socket.emit('chat_message', $('#m').val());
    $('#m').val('');    // clear the text box
    return false;
});

$("#discButton").click(function disconnect() {
    socket.close();
    console.log("disconnect");
});

socket.on('chat_message', function(msg){
    console.log("message: %s", msg);
    $('#messages').append($('<li>').text(msg));
});
    
// The global socket variable is an EventEmitter-like object.
// We can attach a listener to fire when we've connected to the server like so:
socket.on("connect", function () {
    console.log("Connected!");
});