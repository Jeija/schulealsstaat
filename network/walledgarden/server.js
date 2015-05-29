var http = require("http");
var path = require("path");
var fs = require("fs");

var index = fs.readFileSync(path.join(__dirname, "site.html"));
http.createServer(function (req, res) {
	if (req.url.indexOf("generate_204") > -1) {
		// Trick Android into believing it is on the public internet
		res.writeHead(204);
		res.end();
	} else {
		res.writeHead(200, { "Content-Type" : "text/html" });
		res.end(index);
	}
}).listen(80);
