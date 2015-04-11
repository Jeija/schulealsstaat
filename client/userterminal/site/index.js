var RADIO_BASEURL = "http://radio.saeu:8000/"

function load_subdir (dir) {
	$("#page").hide();
	$('.mainlink').removeClass("link-selected");
	$('.mainlink[data-subdir="' + dir + '"]').addClass("link-selected");
	$("#page").load(dir + "/index.html", function () {
		load_common_events();
		$("<link>", {
			rel: "stylesheet",
			type: "text/css",
			href: dir + "/styles.css"
		}).appendTo("head");
		$.getScript(dir + "/scripts.js");
	});
}

// Start audio playback or resume if internet is lost
function startRadio() {
	var player = $("#radio")[0];
	var isPlaying = player ? !player.paused && !player.ended && player.currentTime > 0 : false;
	if (!isPlaying) {
		$("#radio").remove();
		$("<audio>", {
			id : "radio",
			src : RADIO_BASEURL + "stream.ogg",
			type : "audio/ogg"
		}).appendTo("#radio_container");
		$("#radio").prop("volume", $("#volume").val());
		$("#radio")[0].play();
	}
}

// Radio Metadata
function updateRadioMeta() {
	$.get(RADIO_BASEURL + "status-json.xsl", function (meta) {
		var name = meta.icestats.source.artist != "" ?
			meta.icestats.source.artist + " - " + meta.icestats.source.title :
			meta.icestats.source.title;
		$("#radiometa").text(name);
	});
}

$(function () {
	load_subdir("transaction_simple");

	$(".mainlink").click(function () {
		load_subdir($(this).data("subdir"));
	});

	$("#volume").on("input change", function () {
		$("#radio").prop("volume", this.value);
	});

	startRadio();
	updateRadioMeta();
	setInterval(updateRadioMeta, 300);
	setInterval(startRadio, 3000);
});
