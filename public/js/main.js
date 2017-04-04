var socket = require('socket.io-client')();
var $ = require('jquery');
var Peer = require('simple-peer');
var p = new Peer({ initiator: location.hash === '#1', trickle: false });

$('#sendForm').submit(function(event){
    event.preventDefault();
    p.send($('#m').val());
    $('#messages').append($('<li>').text($('#m').val()));
    $('#m').val('');    // clear the text box
});

$("#discButton").click(function disconnect() {
    socket.close();
    p.destroy();
    console.log("websocket and p2p disconnected");
});

// ----------------------------------------------------------------------------
// socketio event
// ----------------------------------------------------------------------------
socket.on('signal_message', function(msg){
    console.log('signal message received from the signaling server');
    p.signal(JSON.parse(msg));
});
    
// The global socket variable is an EventEmitter-like object.
// We can attach a listener to fire when we've connected to the server like so:
socket.on("connect", function () {
    console.log("websocket connected!");
});

// ----------------------------------------------------------------------------
// simple-peer event
// ----------------------------------------------------------------------------
p.on('error', function (err) { console.log('error', err) });

p.on('signal', function (data) {
  console.log('SIGNAL', JSON.stringify(data));
  // pass it to the signaling server
  socket.emit('signal_message', JSON.stringify(data));
});

p.on('connect', function() {
  console.log('CONNECT');
});

p.on('close', function() {
  console.log('CLOSE');
});

p.on('data', function(data) {
  console.log('data: ' + data);
  $('#messages').append($('<li>').text(data));
  
  if (data == 'getBattery') {
    if (isWebBluetoothEnabled()) {
      getBatteryService();
    }  
  }
});

// ----------------------------------------------------------------------------
// web bluetooth
// ----------------------------------------------------------------------------

function getBatteryService() {
  log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice(
    {filters: [{services: ['battery_service']}]})
  .then(device => {
    log('Connecting to GATT Server...');
    return device.gatt.connect();
  })
  .then(server => {
    log('Getting Battery Service...');
    return server.getPrimaryService('battery_service');
  })
  .then(service => {
    log('Getting Battery Level Characteristic...');
    return service.getCharacteristic('battery_level');
  })
  .then(characteristic => {
    log('Reading Battery Level...');
    return characteristic.readValue();
  })
  .then(value => {
    let batteryLevel = value.getUint8(0);
    log('> Battery Level is ' + batteryLevel + '%');
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function isWebBluetoothEnabled() {
  if (navigator.bluetooth) {
    return true;
  } else {
    console.log('Web Bluetooth API is not available.\n' +
                'Please make sure the "Experimental Web Platform features" flag is enabled.');
    return false;
  }
}