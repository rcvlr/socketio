 
// http-server /path/to/index.html
// chrome.exe --unsafely-treat-insecure-origin-as-secure=http://10.50.33.183:8080/ --user-data-dir="C:\\prova" http://10.50.33.183:8080/index.html

var SimplePeer = require('simple-peer')

var constraints = window.constraints = {
    audio: true,
    video: true
};

// get video/voice stream
//navigator.getUserMedia({ video: true, audio: true }, gotMedia, errorCallback)
navigator.mediaDevices.getUserMedia(constraints).
    then(gotMedia).catch(errorCallback);

function errorCallback(error){
    console.log("getUserMedia error: ", error);
}

function gotMedia (stream) {
    var peer1 = new SimplePeer({ initiator: true, stream: stream });
    var peer2 = new SimplePeer();

    peer1.on('signal', function (data) {
	peer2.signal(data);
    });

    peer2.on('signal', function (data) {
	peer1.signal(data);
    });

    peer2.on('stream', function (stream) {
	// got remote video stream, now let's show it in a video tag
	console.log("peer2 got remote video from peer1");

	var video = document.querySelector('video');
	var videoTracks = stream.getVideoTracks();
	console.log('Got stream with constraints:', constraints);
	console.log('Using video device: ' + videoTracks[0].label);

	stream.oninactive = function() {
	    console.log('Stream inactive');
	};
	
	window.stream = stream; // make variable available to browser console
	video.srcObject = stream;
    });
}
