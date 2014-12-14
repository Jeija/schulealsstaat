navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
	|| navigator.mozGetUserMedia || navigator.msGetUserMedia
	|| navigator.oGetUserMedia;

var QRReader = {};
QRReader.active = false;
QRReader.webcam = null;
QRReader.canvas = null;
QRReader.ctx = null;
QRReader.decoder = null;


/**
 * \brief QRReader Initialization
 * Call this as soon as the document has finished loading.
 *
 * \param webcam_selector JQuery selector for the webcam video tag
 */
QRReader.init = function (webcam_selector) {
	// Init Webcam + Canvas
	QRReader.webcam = document.querySelector(webcam_selector);
	QRReader.canvas = document.createElement("canvas");
	QRReader.ctx = QRReader.canvas.getContext("2d");
	var streaming = false;
	QRReader.decoder = new Worker("../qrscan/decoder.js");

	// Resize webcam according to input
	QRReader.webcam.addEventListener("play", function (ev) {
		if (!streaming) {
			QRReader.canvas.width = 600;
			QRReader.canvas.height = Math.ceil(600 / QRReader.webcam.clientWidth *
				QRReader.webcam.clientHeight);
			streaming = true;
		}
	}, false);

	// Start capturing video only
	function startCapture(camera) {
		var constraints = {audio: false};
		if (camera) constraints.video = camera;
		else constraints.video = true;

		// Start video capturing
		navigator.getUserMedia(constraints, function(stream) {
			QRReader.webcam.src = window.URL.createObjectURL(stream);
		}, function(err) {
			console.log("Error in navigator.getUserMedia: " + err);
		});
	}

	// Firefox lets users choose their camera, so no need to search for an environment
	// facing camera
	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		startCapture(null);
	else {
		MediaStreamTrack.getSources(function (sources) {
			var found_env_cam = false;
			for (var i = 0; i < sources.length; i++) {
				if (sources[i].kind == "video" && sources[i].facing == "environment") {
					var constraints = {optional: [{sourceId: sources[i].id}]};
					startCapture(constraints);
					
					found_env_cam = true;
				}
			}

			// If no specific environment camera is found (non-smartphone), user chooses
			if (!found_env_cam) startCapture(null);
		});
	}
}

/**
 * \brief QRReader Scan Action
 * Call this to start scanning for QR codes.
 *
 * \param A function(scan_result)
 */
QRReader.scan = function (callback) {
	QRReader.active = true
	function onDecoderMessage(e) {
		if (e.data.success === true && e.data.result.length > 0) {
			var qrid = e.data.result[0].pop();
			QRReader.active = false
			callback(qrid);
		}
		setTimeout(newDecoderFrame, 0);
	}
	QRReader.decoder.onmessage = onDecoderMessage;

	// Start QR-decoder
	function newDecoderFrame() {
		if (!QRReader.active) return;
		try {
			QRReader.ctx.drawImage(QRReader.webcam, 0, 0,
				QRReader.canvas.width, QRReader.canvas.height);

			QRReader.decoder.postMessage({
				imageData: QRReader.ctx.getImageData(0, 0, QRReader.canvas.width,
					QRReader.canvas.height).data,
				width: QRReader.canvas.width,
				height: QRReader.canvas.height
			});
		} catch(e) {
			// Try-Catch to circumvent Firefox Bug #879717
			if (e.name == "NS_ERROR_NOT_AVAILABLE") setTimeout(newDecoderFrame, 0);
		}
	}
	newDecoderFrame();
}
