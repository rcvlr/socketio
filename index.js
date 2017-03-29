var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// The main idea behind Socket.IO is that you can send and receive any events you want, 
// with any data you want. Any objects that can be encoded as JSON will do, and binary 
// data is supported too.

var handleClient = function (socket) {
    // we've got a client connection
    console.log('a user connected, id: ' + socket.id);
    
    // to make things interesting, send stuff every second
    var i = 0;
    var interval = setInterval(function () {
        var tweet = {user: "nodesource", text: "Hello, world! " + i};
        socket.emit("tweet", tweet);
        console.log("tweet %s", i);
        i = i+1;
    }, 1000);
    
    socket.on('disconnect', function(){
        console.log('user disconnected');
        clearInterval(interval);
    });
  
    socket.on('chat_message', function(msg){
        io.emit('chat_message', msg);
        console.log('message: ' + msg);
    });
};

io.on('connection', handleClient);

http.listen(3000, function(){
  console.log('listening on *:3000');
});