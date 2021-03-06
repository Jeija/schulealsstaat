var PWD_REQUIRED = "";
var childp = null;
var mplayer = null;

if (typeof require !== "undefined") {
	var childp = require("child_process");
}

var QRID_PRESETS = {};

var RADIO_STREAMURL = "http://radio.saeu:8000/stream.ogg";
var RADIO_METAURL = "http://radio.saeu:8000/status-json.xsl";

if (process) {
	process.on("exit", function () {
		if (mplayer) mplayer.kill();
	});
}

function load_subdir (dir) {
	// Destroy old page including events
	$("#page").find("*").unbind();
	var pagehtml = null, interval = null;

	$.get(dir + "/index.html", function (res) {
		pagehtml = res;
	});

	function show_new_page () {
		if (!pagehtml) return;
		clearInterval(interval);
		$("#page").html("");

		$('.mainlink').removeClass("link-selected");
		$('.mainlink[data-subdir="' + dir + '"]').addClass("link-selected");
		$("#page").html(pagehtml).ready(function () {
			load_common_events();
			$("<link>", {
				rel: "stylesheet",
				type: "text/css",
				href: dir + "/styles.css"
			}).appendTo("head");

			// Load new events
			$.getScript(dir + "/scripts.js");
		});
	}

	$("#page").fadeOut(300, function () {
		interval = setInterval(show_new_page, 100);
	});
}

// Start audio playback or resume if internet is lost
function startRadio() {
	if (!childp) return;
	mplayer = childp.spawn("mplayer", [ "-cache", "100", "-cache-min", "50", "-slave", "-softvol",
		"-quiet", "-volume", $("#volume").val(), RADIO_STREAMURL ]);

	mplayer.on('close', function () {
		setTimeout(startRadio, 200);
	});

	mplayer.stdout.on("data", function (data) {
		console.log("[mp] " + data);
	});
}

// Radio Metadata
function updateRadioMeta() {
	$.get(RADIO_METAURL, function (meta) {
		if (!meta) return;
		if (!meta.icestats.source) return;
		var name = meta.icestats.source.artist !== "" ?
			meta.icestats.source.artist + " - " + meta.icestats.source.title :
			meta.icestats.source.title;
		$("#radiometa").text(name);
	});
}

$(function () {
	load_subdir("use_master");
	load_subdir("transaction_simple");

	$(".mainlink").click(function () {
		var subdir = $(this).data("subdir");
		load_subdir(subdir);
	});

	// 5x click on menu item reloads page
	var clicknum_reset = 0;
	$("#volume").click(function () {
		console.log("click");
		clicknum_reset++;
		if (clicknum_reset >= 5) {
			mplayer.kill();
			window.location.reload();
		}
		setTimeout(function () {
			clicknum_reset = 0;
		}, 1000);
	});

	$("#volume").on("input change", function () {
		if (!mplayer) return;
		mplayer.stdin.write("volume " + this.value + " 1\n");
	});

	// 5x click on EU flag opens configuration
	var clicknum = 0;
	$("#header_eu").click(function () {
		clicknum++;
		if (clicknum >= 5) $("#settings").show();
		setTimeout(function () {
			clicknum = 0;
		}, 1000);
	});

	// Restart stream by double-clicking volume icon
	$("#volume_icon").dblclick(function () {
		if (mplayer) mplayer.kill();
	});

	$("#settings_exit").click(function () {
		$("#settings").hide();
		try {
			QRID_PRESETS = JSON.parse($("#qrid_presets").val());
		} catch(e) {
			alert(e);
		}
	});

	startRadio();
	updateRadioMeta();
	setInterval(updateRadioMeta, 300);
});
