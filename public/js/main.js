// To run it on a VM use the following command:
// chromium 10.0.2.2:5000 --enable-experimental-web-platform-features --user-data-dir=/tmp/foo --unsafely-treat-insecure-origin-as-secure=http://10.0.2.2:5000/

var socket = require('socket.io-client')();
var $ = require('jquery');
var Peer = require('simple-peer');
var p = new Peer({ initiator: location.hash === '#1', trickle: false });

$("#scanButton").hide();
$("#scanButton").click(getBatteryService);

$('#sendForm').submit(function(event){
    event.preventDefault();
    p.send($('#m').val());
    appendMessage($('#m').val());
    $('#m').val('');    // clear the text box
});

$("#discButton").click(function disconnect() {
    socket.close();
    p.destroy();
    console.log("websocket and p2p disconnected");
});

function appendMessage(msg) {
  $('#messages').append($('<li>').text(msg));
}

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
  appendMessage(data);
  
  if (data == 'getBattery') {
    if (isWebBluetoothEnabled()) {
      // As a security feature, discovering Bluetooth devices with 
      // navigator.bluetooth.requestDevice must be triggered by a user gesture
      $("#scanButton").show("slow");
    }
  }
});

// ----------------------------------------------------------------------------
// web bluetooth
// ----------------------------------------------------------------------------

function getBatteryService() {
  console.log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice(
    {filters: [{services: ['battery_service']}]})
  .then(device => {
    console.log('Connecting to GATT Server...');
    return device.gatt.connect();
  })
  .then(server => {
    console.log('Getting Battery Service...');
    return server.getPrimaryService('battery_service');
  })
  .then(service => {
    console.log('Getting Battery Level Characteristic...');
    return service.getCharacteristic('battery_level');
  })
  .then(characteristic => {
    console.log('Reading Battery Level...');
    return characteristic.readValue();
  })
  .then(value => {
    let batteryLevel = value.getUint8(0);
    console.log('> Battery Level is ' + batteryLevel + '%');
    appendMessage('> Battery Level is ' + batteryLevel + '%');
    p.send('> Battery Level is ' + batteryLevel + '%');
  })
  .catch(error => {
    console.log('Argh! ' + error);
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
