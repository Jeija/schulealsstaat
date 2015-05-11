var STREAMURL = "http://192.168.0.100:8000/stream.ogg";
var METAURL = "http://192.168.0.100:8000/status-json.xsl";
var isPlaying = false;
var player = null;

// Radio Metadata
function updateRadioMeta() {
	$.get(METAURL, function (meta) {
		var name = meta.icestats.source.artist != "" ?
			meta.icestats.source.artist + " - " + meta.icestats.source.title :
			meta.icestats.source.title;
		$("#radiometa").text(name);
	});
}

// Start audio playback or resume if internet is lost
function startRadio() {
	player = player || $("<audio>", {
		id : "radio",
		src : STREAMURL,
		type : "audio/ogg"
	})[0];
	player.play();
}

setInterval(function () {
	isPlaying = player ? !player.paused && !player.ended && player.currentTime > 0 : false;
	if (isPlaying) {
		$("#playpause").prop("src", "res/pause.svg");
	} else {
		$("#playpause").prop("src", "res/play.svg");
	}
}, 200);

$(function () {
	player = null;
	$("#playpause").click("click", function () {
		if (isPlaying) {
			player.pause();
		} else {
			startRadio();
		}
	});

	setInterval(function () {
		updateRadioMeta();
	}, 10000);
	updateRadioMeta();
});
