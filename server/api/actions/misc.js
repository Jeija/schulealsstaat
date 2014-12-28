module.exports = function (register){
	register("test", function (arg, res){
		console.log("Test Action")

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write("API Echo Test\n");
		res.write("------------------------\n");
		res.write(arg+"\n");
		res.write("------------------------\n");
		res.end();
	});
}
