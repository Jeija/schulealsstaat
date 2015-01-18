var storage = {
	getStorage : function () {
		var str = window.localStorage.getItem("sasapp");
		var data;

		try {
			return JSON.parse(str) || {};
		} catch(e) {
			return {};
		}
	},

	set : function (key, value) {
		var data = storage.getStorage();
		data[key] = value;
		window.localStorage.setItem("sasapp", JSON.stringify(data));
	},

	get : function (key) {
		var data = storage.getStorage();
		return data[key];
	}
};
