$(function () {
	$("#confirm").click(function () {
		localStorage.clear();
		window.location = "authenticate.html";
	});
});
