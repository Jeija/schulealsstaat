module.exports = function (register){
	register("test", function (payload, answer) {
		console.log("Test Action");

		answer("API Echo Test\n----------\n"
			+ JSON.stringify(payload)
			+ "\n----------");
	});
};
