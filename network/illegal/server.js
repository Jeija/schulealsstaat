var http = require("http");
var path = require("path");
var fs = require("fs");

var index = fs.readFileSync(path.join(__dirname, "site", "index.html"));
var euflag = fs.readFileSync(path.join(__dirname, "site", "euflag.svg"));
var styles = fs.readFileSync(path.join(__dirname, "site", "styles.css"));
http.createServer(function (req, res) {
	res.writeHead(200);
	if (req.url.indexOf("euflag.svg") > -1)
		res.end(euflag);
	else if (req.url.indexOf("styles.css") > -1)
		res.end(styles);
	else
		res.end(index);
}).listen(80);
