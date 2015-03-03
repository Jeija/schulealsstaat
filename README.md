## Only notes, complete README is TODO

## IPs
* 192.168.2.100 - 192.168.30.250 for clients
* 192.168.2.10: Network management server, consisting of:
  - DHCP Server
  - DNS Server
  - DNS blocking redirect server, non-internal domain DNS requests will be redirected to this server, displays STOP!-sign

  These servers can optionally be split up to run on multiple machines, having all of them on the same machine is easier for development though.

* 192.168.2.30: API Server
* 192.168.2.31: Passport Picture Server (webcamserver)
* 192.168.2.40: Client-facing central bank web portal website

## Internet Filtering
Userterminals will create their wifi networks using the script in `network/wifi/wifi.sh`.
They must `ebtables-restore < ebtables.save` (`ebtables.save` is in `network/wifi`) immediately after setting up their WiFi access point.

## Dependencies
The `terminaliso` has to be built on Archlinux, the `prepare.sh` script prepares the environment and
installs build dependencies. All other dependencies will be installed by `init.sh`. On Debian-based
distors and on Arch-based ones, it will install all dependencies, including tmux and nodejs + npm.
On other distributions, you have to install `tmux` and `nodejs` *before* executing the script.

## Known attacks
### Get access to passport photos
* Intercept webcam_cert by intercepting WiFi traffic
* Use student_identify to identify picname of arbitrary students
* Call [WebcamServerIP]:[WebcamServerPort]/get/[picname] for student
* Retrieve picture

**Solutions**:
* Implement HTTPS encryption for webcam server requests (requires installation of untrusted HTTPS certificate on all devices that need to access the pictures
* Use encrypted WiFi for devices accessing the webcam server (the attacker would then have to physically intercept the ethernet connection)
* Detect suspicious requests and switch the webcam_cert often enough (since an attack is not very propable on not very relevant data and in the intranet)

### DDoS / Spam the webcam server by uploading arbitrary data as images
* [WebcamServerIP]:[WebcamServerPort]/upload/[filename]
* Send arbitrary data as POST data

**Solutions**
* Disable the picture upload feature during the project
* Use a password / certificate check for picture uploading
* Detect suspicious requests and block / find the attacker in the intranet
