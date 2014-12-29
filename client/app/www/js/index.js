/* TODO

document.addEventListener("deviceready"; onDeviceReady, false);

function onDeviceReady() {
document.getElementById("Info").innerHTML = "App geladen!";
}
*/


function myFunction() {
document.getElementById("Info").innerHTML = "Geladen!";
}

window.setTimeout(function() {
    window.location.href = 'main.html';
}, 1000);
