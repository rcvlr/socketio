// http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// configuration
app.use(express.static('public'));
app.set('port', (process.env.PORT || 5000));

// route
app.get('/', function(req, res){
  res.sendFile('index.html');
})

var handleClient = function(socket) {
    
    console.log('a user connected, id: ' + socket.id);
    
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    
    socket.on('signal_message', function(msg){
        // broadcast to all the connected clients except the sender
        socket.broadcast.emit('signal_message', msg);
        console.log('signal_message: ' + msg);
    });
};

io.on('connection', handleClient);

http.listen(app.get('port'), function(){
  console.log('listening on *:' + app.get('port'));
});