var http = require("http");
var path = require("path");
var fs = require("fs");

var index = fs.readFileSync(path.join(__dirname, "site", "index.html"));
var euflag = fs.readFileSync(path.join(__dirname, "site", "euflag.svg"));
var styles = fs.readFileSync(path.join(__dirname, "site", "styles.css"));
http.createServer(function (req, res) {
	if (req.url.indexOf("generate_204") > -1) {
		// Trick Android into believing it is on the public internet
		res.writeHead(204);
		res.end();
	} else if (req.url.indexOf("euflag.svg") > -1) {
		res.writeHead(200, { "Content-Type" : "image/svg+xml" });
		res.end(euflag);
	} else if (req.url.indexOf("styles.css") > -1) {
		res.writeHead(200, { "Content-Type" : "text/css" });
		res.end(styles);
	} else {
		res.writeHead(200, { "Content-Type" : "text/html" });
		res.end(index);
	}
}).listen(80);
