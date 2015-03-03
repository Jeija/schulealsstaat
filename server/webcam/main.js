/**
 * Requests must follow this schema:
 * POST Request: [IP]:[PORT]/get/[PICNAME]
 * Where POST data is webcam_cert
 * Answer: base64-encoded png image
 *
 * POST Request: [IP]:[PORT]/upload/[PICNAME]
 * Where POST data is a JSON:
 * { name : "[RANDOM_IMAGE_NAME]", pic : "[BASE64-ENCODED-PNG]" }
 */

var http = require("http");
var qs = require("querystring");
var fs = require("fs");
var crypto = require("crypto");
var cert = require("./cert.js");
var log = require("./logging.js");

var IMG_PATH = "/img/";

function upload_image(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});

	process.stdout.write("Uploading Image [..]");
	var imgdata = "";

	req.on("data", function (data) { imgdata += data; });
	req.on("end", function () {
		var img = JSON.parse(imgdata);
		console.log("\b\b\bOK]");
		var filename = __dirname + IMG_PATH + img.name + ".png";
		console.log("--> Saving as " + filename);
		var webcamData = img.pic.replace(/^data:image\/png;base64,/, "");
		fs.writeFile(filename, webcamData, "base64", function (err) {
			if (err) console.log("ERROR:" + err);
		});
	});

	res.end("ok");
}

function get_image(req, res, query) {
	var imgname = query[1];
	log.info("get_image", "Requested \"" + imgname + ".png\" from " +
		req.connection.remoteAddress);

	// Only answer picture requests with correct certificate
	var clientCert = "";
	var ip = req.connection.remoteAddress;
	req.on("data", function (data) { clientCert += data; });
	req.on("end", function () {
		cert.check(["webcam_hash"], clientCert, ip, function () {
			res.writeHead(200, {'Content-Type': 'image/png',
				'Access-Control-Allow-Origin' : '*'});
			var path =__dirname + IMG_PATH + imgname + ".png";

			fs.exists(path, function (exists) {
				if (!exists) {
					console.log("  --> Could not find requested file: " + path);
					res.end();
					return;
				}

				fs.readFile(path, function (err, data) {
					if (err) {
						log.err("get_image, fs.readFile", err);
					} else {
						res.end(data.toString("base64"));
					}
				});
			});
		});
	});
}

http.createServer(function (req, res) {
	var fragments = req.url.substring(1).split("/");
	var query = fragments.splice(0, 1);
	query.push(fragments.join('/'));
	query[1] = decodeURIComponent(query[1]);

	if (query[0] == "upload") upload_image(req, res);
	else if (query[0] == "get") get_image(req, res, query);
	else {
		console.log("[WEBCAM] Invalid request: " + req.url + " from " +
			req.connection.remoteAddress);
		res.end();
	}
}).listen(1338);

log.ok("WebCamServ", "Started!");
