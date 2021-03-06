# Schule als EU
### Hölderlin-Gymnasium Nürtingen 2015
---
The "Schule als EU" project aims to simulate the real EU at school for one week in 2015. This means a parliament consiting of students, companies, an own currency and more has to be created. This software package can be used to simplify several **governmental management** tasks by storing information in databases and other digital forms instead of collecting them on paper records. Additionally, it provides a set of server and client applications that can be used to manage and transfer a **digital currency**, called *HöGyCoin (HGC)* referring to the school's name, from user accounts that are linked to the ID cards that are used for other management services.

## More Information, Recap of the Project
More information is available on the HöGy Central Bank website over at [centralbank.eu](http://centralbank.eu) and on our [YouTube Channel](https://www.youtube.com/channel/UCv-DBrDT9rd7n0vyF6XbkPg). The whole system was running perfectly fine for the four project days in July 2015 with positive feedback from teachers and students. In case you are interested in implementing this or a similar system, I highly recommend you to contact me early enough. I started coding about one year before the actual project. Obviously, this is not a turnkey solution and I won't customize it for you, but I have a lot of specific technical experience and recommendations to share and I can help you understand everything.

It even got some coverage in [local media](http://www.ntz.de/nachrichten/region/artikel/das-nuertinger-hoegy-wird-zur-europaeischen-union/), [multiple times](http://www.ntz.de/nachrichten/region/artikel/die-eu-betrifft-uns-alle-schule-als-eu-statt-schule-als-staat-am-hoelderlin-gymna/) (German, currently behind paywall) and the mayor of Nürtingen commented on it [in an interview](http://smv.hoegy.de/wp/2015/07/beitraege-von-hoegy-on-air/).

## High-level description
This repo consists of most software components required for the deployment of the HöGyCoin currency and the management system, including both server and client applications, scripts to build ISOs for client Laptops and the mobile (Cordova) App. It also includes utilities for testing server performance and for setting up the large Ethernet network that WiFi clients can be in.

All the software is written in JavaScript, CSS, HTML and a bunch of bash scripts. It uses node.js and MongoDB on the server side, for easier interoperability of client and server applications.

* **The API Server** (`server/api`)
	The API Server manages the main MongoDB-Database that contains all student records including balances, transactions and references to the picture resources. All traffic that reads or writes data from/to the database has to be encrypted (see Security). You can take a closer look at all the possible requests in `server/api/actions/students.js` and `server/api/actions/transactions.js`.

* **The Webcam Server** (`server/webcam`)
	The Webcam Server stores passport images (PNG files) of the registered students. It is seperated from the API server as traffic from or to this server is unencrypted and in order to split up bandwidth between multiple machines. That way, the webcam server can be positioned at the place where most queries to it are sent. While the API requests are just a few kilobytes of data, a picture on the Webcam Server can be of multiple Megabytes of size.

* **The Proxy Script** (`server/online_proxy_ssh.sh`)
	This is just a small utility that forwards connections to the online server (centralbank.eu) to the local server (which is behind a Firewall / NAT). That way, all data is in a central spot and any user data, private keys etc. don't need to be uploaded to the internet.

* **The Management Client** (`client/adminpanel`)
	The Management client can be used to add, remove and modify students and to force transactions as well as for other administrative tasks. You may get asked to provide a master certificate ("Master-Zertifikat"), you can find that in `util/cert/master_cert`. This is the "key" for some tasks that require additional authentication.

* **The User Client** (`client/userterminal`)
	The userterminal client is a simple client for usage by students, visitors and other citizens for money transactions, for viewing their account history and more.

* **The HöGyCoin App** (`client/app`)
	The App is a trimmed down edition of the user client for mobile devices, also written in HTML, CSS and JavaScript using cordova.

* **The `genrequest` client** (`client/genrequest`)
	This client can be used to manually send arbitrary JSON-encoded action requests to the API Server.

* **The Entrycheck Client** (`client/entrycheck`)
	This client can be used to scan ID cards and check in / check out students.

* **The Registration Client** (`client/registration`)
	This client is a more simple version of the registration page in the Management Client that can be used for registering the mass of students in the database with their name, birthday, passport picture and password.

* **The Terminaliso** (`client/terminaliso`)
	This is a set of scripts to create the ISO image that the User Client-Laptops will run off. In order to build the iso, first run `client/terminaliso/prepare.sh` and then `client/terminaliso/iso/build.sh`. These commands have to be issued on a 64-bit x86 Archlinux machine.

* **The Network Folder** (`network`)
	This folder contains scripts for setting up a DHCP, DNS and Walled Garden HTTP Server (`network/management.sh`) and for starting up a terminaliso-like hostapd WiFi AP on Archlinux (`network/accesspoint.sh`). The script only works with USB WiFi adapters using the RaLink RT5370 chip.

## Download and Install
You can download and install the server component, management software, the HöGyCoin-App and more to your own machine.

#### Dependencies
* A computer running Linux, Ubuntu 14.04 and Archlinux have been tested (Mac OS X might also work for some core functions)
* Preferably a Router that you can edit hostnames on (e.g. OpenWRT), but that is not required

#### Network preparation
If you can edit hostnames on your router (that acts as DNS server, e.g. using `dnsmasq`), just add the following lines to the router's `/etc/hosts` file:
```
<IP of development machine> api.saeu
<IP of development machine> cam.saeu
<IP of development machine> packages.saeu
```

You might also want to always assign the same IP to your development machine (e.g. if it has multiple network interfaces) so that the router's DHCP server knows their MAC addresses. In order to do that, edit `/etc/config/dhcp`:

```
config host
	option ip '<IP of development machine>'
	option mac '<MAC Address of development machine network interface 1>, <interface 2>, ...'
	option name '<hostname of development machine>'
```

Then reload the network config using `/etc/init.d/dnsmasq restart`.

If you only want to use the clients on your development machine, you can instead also add the domain name entries to your local `/etc/hosts`:
```
127.0.0.1 api.saeu
127.0.0.1 cam.saeu
127.0.0.1 packages.saeu
```

If, however, you want to access the server from multiple devices such as from the app and you can't edit your router's configuration files, you will have to manually edit the server addresses in the `client/common/api.js` file *before running `./init.sh`* (see Setup). Just follow the instructions in `client/common/api.js` to edit the API server and webcam server address.

#### Setup
* Install the following packages:
	* Ubuntu: `sudo apt install nodejs-legacy npm git mongodb tmux vim g++`
	* Archlinux: `sudo pacman -S base-devel nodejs npm git mongodb tmux vim`
* Install the following node.js packages:
`sudo npm install -g bower http-server node-gyp nodemon nw`
* If there are some npm-errors try to install each npm-package alone.
* Clone this repository *recursively*: `git clone --recursive https://github.com/Jeija/schulealsstaat` and `cd schulealsstaat`
* Let the included script set up your development environment and install project-internal dependencies: `./init.sh`
* Start up API and Webcam Servers and launch HTTP Servers for the client applications: `./develop.sh`

#### Usage
You can now access the client applications at

* [http://localhost:81](http://localhost:81) (Entrycheck client)
* [http://localhost:82](http://localhost:82) (Management client)
* [http://localhost:83](http://localhost:83) (`genrequest` client)
* [http://localhost:84](http://localhost:84) (Registration client)


## Security
As you can buy real goods with this digital currency, the currency system is of particular interest to attackers. Secondly, the collected data has to be well protected, as it contains records of more than a thousand people. We are very aware of this and have developed a number of counter-measures to fight manipulations.

#### Encryption
Even though this project does not use HTTPS for client-server communication, all requests to the API server are encrypted. The clients have an RSA Public Key of the API Server and use it to encrypt a password. This password this then used to encrypt the actual payload of the requests with AES and is also used to encrypt the answer again by the server. In this case the main downside of JavaScirpt cryptography, the often insecure channel of distributing the encryption key and files, is irrelevant since the software on the Laptops is cryptographically signed and the App software is distributed in advance. Also, an attacker that might e.g. try to sniff user's passwords by intercepting WiFi traffic could only be amongst a relatively small number of people in the intranet.

#### Keyfile System
Humand-made passwords can easily be cracked, therefore HöGyCoin uses a system of keyfiles ("admin_cert, master_cert, ...") that contain long arbitrary strings that serve as passwords. These files are included with the respective management client packets, so it has to be made sure that only the person on the computer running the management software has access to the files (e.g. only listen for requests on the loopback interface, not on any public interface). If a certificate got stolen, they can easily be regenerated. The server only stores hashes and compares them.

# Other notes

## IPs
* 192.168.2.* is reserved for servers
* 192.168.5.* - 192.168.9.* is reserved for laptops (terminals)
* 192.168.10.100 - 192.168.200.250 for mobile clients
* 192.168.2.10 + 192.168.2.11: Network management servers (failover), consisting of:
  - DHCP Server
  - DNS Server
  - Captive portal / walled garden: Non-internal domain DNS requests will be redirected to that
  - Package server: Servers software for terminal computers to download (enables patching by reboot)
* 192.168.2.30 + 192.168.2.31: API Servers (failover + load balancing)
* 192.168.2.60: Passport Picture Server (webcamserver)
* 192.168.2.70: Communication server

## Internet Filtering
Userterminals will create their wifi networks. They set up some firewalling rules with ebtables to prevent access from mobile clients to servers other than those in the IP range 192.168.2.0/24.

## Known attacks
### Get access to passport photos (kind of fixed)
* Intercept webcam_cert by intercepting WiFi traffic
* New: Requires guessing picname of arbitrary students, which is a long random string, so the attack has become very unlikely
* Call [WebcamServerIP]:[WebcamServerPort]/get/[picname] for student
* Retrieve picture

**Solutions**:
* Implement HTTPS encryption for webcam server requests (requires installation of untrusted HTTPS certificate on all devices that need to access the pictures
* Use encrypted WiFi for devices accessing the webcam server (the attacker would then have to physically intercept the ethernet connection)
* Detect suspicious requests and switch the webcam_cert often enough (since an attack is not very propable on not very relevant data and in the intranet)

### DDoS / Spam the webcam server by uploading arbitrary data as images
* [WebcamServerIP]:[WebcamServerPort]/upload/[filename]
* Send arbitrary data as POST data
* The webcam server is no critical infrastructure, so this is a low priority issue

**Solutions**
* Disable the picture upload feature during the project
* Use a password / certificate check for picture uploading
* Detect suspicious requests and block / find the attacker in the intranet

