$(function () {
	qr.image({
		image : $("#qrcode")[0],
		value : storage.get("qrid"),
		level : "M",
		size : 10
	});
});
