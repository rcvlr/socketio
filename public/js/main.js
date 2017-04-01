var socket = require('socket.io-client')();
var $ = require('jquery')
var Peer = require('simple-peer')
var p = new Peer({ initiator: location.hash === '#1', trickle: false })

$('#sendForm').submit(function(event){
    event.preventDefault()
    p.send($('#m').val())
    $('#messages').append($('<li>').text($('#m').val()))
    $('#m').val('')    // clear the text box
})

$("#discButton").click(function disconnect() {
    socket.close()
    p.destroy()
    console.log("websocket and p2p disconnected")
})

socket.on('signal_message', function(msg){
    console.log('signal message received from the signaling server')
    p.signal(JSON.parse(msg))
})
    
// The global socket variable is an EventEmitter-like object.
// We can attach a listener to fire when we've connected to the server like so:
socket.on("connect", function () {
    console.log("websocket connected!")
})

// simple-peer
p.on('error', function (err) { console.log('error', err) })

p.on('signal', function (data) {
  console.log('SIGNAL', JSON.stringify(data))
  // pass it to the signaling server
  socket.emit('signal_message', JSON.stringify(data))
})

p.on('connect', function() {
  console.log('CONNECT')
})

p.on('close', function() {
    console.log('CLOSE')
})

p.on('data', function(data) {
  console.log('data: ' + data)
  $('#messages').append($('<li>').text(data))
})
