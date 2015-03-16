var TCPPORT = 1233;

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
var path = require("path");
var fs = require("fs");
var cert = require("./cert.js");
var log = require("./logging.js");

var IMG_PATH = "img";

/**
 * upload_image
 * Upload image files to the server. Does not require authentication, but may be disabled or
 * restricted to certain sources during the project. See first comment for more information.
 */
function upload_image(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});

	var ip = req.connection.remoteAddress;

	log.info("upload_image", ip + " uploads file...");

	var imgdata = "";
	req.on("data", function (data) { imgdata += data; });
	req.on("end", function () {
		var img = JSON.parse(imgdata);
		var fn = path.join(__dirname, IMG_PATH, img.name + ".png");
		log.info("upload_image", ip + ": completed, saving to " + fn);

		var png = img.pic.replace(/^data:image\/png;base64,/, "");
		fs.writeFile(fn, png, { encoding: "base64", flag : "wx" }, function (err) {
			if (err) {
				log.err("upload_image", "fs.writeFile: " + err);
				res.end("error: fs.writeFile: " + err);
			} else {
				res.end("ok");
			}
		});
	});
}

/**
 * get_image
 * Get a base64-encoded png image from the server.
 */
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
			var fn = path.join(__dirname, IMG_PATH, imgname + ".png");

			fs.readFile(fn, function (err, data) {
				if (err) {
					log.warn("get_image, fs.readFile " + fn + ": " + err);
					res.end();
					return;
				} else {
					res.end(data.toString("base64"));
				}
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
		log.info("main", "Invalid request: " + req.url + " from " +
			req.connection.remoteAddress);
		res.end();
	}
}).listen(TCPPORT);

log.ok("WebCamServ", "Started!");
