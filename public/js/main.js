var socket = io();

$(document).ready(function() {

    $('#sendForm').submit(function(){
        socket.emit('chat_message', $('#m').val());
        $('#m').val('');    // clear the text box
        return false;
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
        
    // To consume the data in the browser, we need to listen for the "tweet" event.
    socket.on("tweet", function(tweet) {
        // todo: add the tweet as a DOM node
        console.log("tweet from", tweet.user);
        console.log("contents:", tweet.text);
    });
        
    
});

function disconnect() {
    socket.close();
    console.log("disconnect");
}