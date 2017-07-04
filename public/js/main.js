// To run it on a VM use the following command:
// chromium 10.0.2.2:5000 --enable-experimental-web-platform-features --user-data-dir=/tmp/foo --unsafely-treat-insecure-origin-as-secure=http://10.0.2.2:5000/

// TODO: avoid connecting all the times.

var socket = require('socket.io-client')();
var $ = require('jquery');
var Peer = require('simple-peer');
var p = new Peer({ initiator: location.hash === '#1', trickle: true });

$("#scanButton").hide();
$("#scanButton").click(getDevice);

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
  window.scrollTo(0, document.body.scrollHeight);
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
  
  switch (String(data)) {
    case 'get device':
      if (isWebBluetoothEnabled()) {
        // As a security feature, discovering Bluetooth devices with 
        // navigator.bluetooth.requestDevice must be triggered by a user gesture
        $("#scanButton").show("slow");
      }
      break;
    
    case 'get battery':
      getBatteryValue();
      break;
       
    case 'start notify':
      enableBatteryNotification();
      break;
      
    case 'stop notify':
      disableBatteryNotification();
      break;
      
    default:
        break;
  }
   
});

// ----------------------------------------------------------------------------
// web bluetooth
// ----------------------------------------------------------------------------
var btDevice = null;
var battCharacteristic;

/**
 * Check if WebBluetooth is supported/enabled by the browser.
 */
function isWebBluetoothEnabled() {
  if (navigator.bluetooth) {
    return true;
  } else {
    console.log('Web Bluetooth API is not available.\n' +
                'Please make sure the "Experimental Web Platform features" flag is enabled.');
    return false;
  }
}

/**
 * Scan for devices exposing the Battery service.
 */
function getDevice()
{
  console.log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({filters: [{services: ['battery_service',]}]})
  .then(device => {
    // set the default device
    btDevice = device;
    console.log('Device found is called ' + btDevice.name);
    p.send('Device found is called ' + btDevice.name);
  })
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

/**
 * Enable battery notifications on the default device
 * that was previously discovered.
 */
function enableBatteryNotification() {
  // create a promise that connect to the previously discovered device
  var connectDevice = new Promise(function(resolve, reject) {
    if (btDevice) {
      server = btDevice.gatt.connect();
      resolve(server);
    }
    else {
      reject(Error("No device"));
    }
  });
  
  connectDevice
  .then(server => {
    console.log('Getting Service...');
    return server.getPrimaryService('battery_service');
  })
  .then(service => {
    console.log('Getting Characteristic...');
    return service.getCharacteristic('battery_level');
  })
  .then(characteristic => {
    battCharacteristic = characteristic;
    return battCharacteristic.startNotifications().then(_ => {
      console.log('> Notifications started');
      battCharacteristic.addEventListener('characteristicvaluechanged',
          handleNotifications);
    });
  })
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

/**
 * Handler for the battery notification events
 */
function handleNotifications(event) {
  let batteryLevel = event.target.value.getUint8(0);
  console.log('> Battery level notification: ' + batteryLevel + '%');
  appendMessage('> Battery level notification: ' + batteryLevel + '%');
  p.send('> Battery Level notification: ' + batteryLevel + '%');
}

/**
 * Disable battery notifications.
 */
function disableBatteryNotification() {
  if (battCharacteristic) {
    battCharacteristic.stopNotifications()
    .then(_ => {
      console.log('> Notifications stopped');
      battCharacteristic.removeEventListener('characteristicvaluechanged',
          handleNotifications);
    })
    .catch(error => {
      console.log('Argh! ' + error);
    });
  }
}

/**
 * Read the battery value.
 */
function getBatteryValue() {
  // create a promise that connect to the previously discovered device
  var connectDevice = new Promise(function(resolve, reject) {
    if (btDevice) {
      server = btDevice.gatt.connect();
      resolve(server);
    }
    else {
      reject(Error("No device"));
    }
  });
  
  connectDevice
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
