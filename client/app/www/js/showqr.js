$(function () {
	qr.image({
		image : $("#qrcode")[0],
		value : storage.get("qrid"),
		level : "M",
		size : 10
	});
	console.log(student2readable(storage.get("profile")));
	$("#qrid").text(storage.get("qrid"));
	$("#readable").text(student2readable(storage.get("profile")));
});
