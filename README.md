# Schule als EU
### Hölderlin-Gymnasium Nürtingen 2015
---
The "Schule als EU" project aims to simulate the real EU at school for one week in 2015. This means a parliament consiting of students, companies, an own currency and more has to be created. This software package can be used to simplify several **governmental management** tasks by storing information in databases and other digital forms instead of collecting them on paper records. Additionally, it provides a set of server and client applications that can be used to manage and tranfer a **digital currency**, called *HöGyCoin (HGC)* referring to the school's name, from user accounts that are linked to the ID cards that are used for other management services.

## Live Demo / PR
You can either download the software and set it up by yourself, or you can just try out a demo of the currency system. This demo may not always be online and data in the demo database will be erased on a regular basis. Refer to the HöGy Central Bank website over at [centralbank.eu](http://centralbank.eu) for more information and news updates on the current status of the project.
The Live Demo usually does *NOT* represent the very current state of development but is a usually somewhat outdated and modified version of the software in this repo. Currently, it also misses a lot of functionality that is available in local installs.

## High-level description
This repo consists of most software components required for the deployment of the HöGyCoin currency and the management system, including both server and client applications, scripts to build ISOs for client Laptops and the mobile (Cordova) App. It also includes utilities for testing server performance and for setting up the large Ethernet network that WiFi clients can be in.

All the software is written in JavaScript, CSS, HTML and a bunch of bash scripts. It uses node.js and MongoDB on the server side, for easier interoperability of client and server applications.

* **The API Server** (`server/api`)
	The API Server manages the main MongoDB-Database that contains all student records including balances, transactions and references to the picture resources. All traffic that reads or writes data from/to the database has to be encrypted (see Security). You can take a closer look at all the possible requests in `server/api/actions/students.js` and `server/api/actions/transactions.js`.

* **The Webcam Server** (`server/webcam`)
	The Webcam Server stores passport images (PNG files) of the registered students. It is seperated from the API server as traffic from or to this server is unencrypted and in order to split up bandwidth between multiple machines. That way, the webcam server can be positioned at the place where most queries to it are sent. While the API requests are just a few kilobytes of data, a picture on the Webcam Server can be of multiple Megabytes of size.

* **The Proxy Server** (`server/proxy`)
	This is just a small utility that consists of an internet and an intranet component. The internet component can be installed on a publicly accessible domain, such as [centralbank.eu](http://centralbank.eu). Even if the client is not in the intranet, it can then send requests to the API Server to the internet component. The intranet component regularly asks for new API requests and forwards them to the real API Server. Instead, an HTTP-over-SSH tunnel may also be used, but the method with the Proxy Server has the advantage of being able to cache requests if the API server is offline or when switching the API server from one machine to another.

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
	* Ubuntu: `sudo apt install nodejs-legacy npm git mongodb tmux`
	* Archlinux: `sudo pacman -S nodejs git mongodb tmux`
* Install the following node.js packages:
`sudo npm install -g bower http-server node-gyp nodemon nw`
* Clone this repository *recursively*: `git clone --recursive https://github.com/Jeija/schulealsstaat` and `cd schulealsstaat`
* Let the included script set up your development environment and install project-internal dependencies: `./init.sh`
* Start up API and Webcam Servers and launch HTTP Servers for the client applications: `./develop.sh`

#### Usage
You can now access the client applications at

* [http://localhost:80](http://localhost:80) (Registration client)
* [http://localhost:81](http://localhost:81) (Entrycheck client)
* [http://localhost:82](http://localhost:82) (Management client)
* [http://localhost:83](http://localhost:83) (`genrequest` client)

## Security
As you can buy real goods with this digital currency, the currency system is of particular interest to attackers. Secondly, the collected data has to be well protected, as it contains records of more than a thousand people. We are very aware of this and have developed a number of counter-measures to fight manipulations.

#### Encryption
Even though this project does not use HTTPS for client-server communication, all requests to the API server are encrypted. The clients have an RSA Public Key of the API Server and use it to encrypt a password. This password this then used to encrypt the actual payload of the requests with AES and is also used to encrypt the answer again by the server. In this case the main downside of JavaScirpt cryptography, the often insecure channel of distributing the encryption key and files, is irrelevant since the software on the Laptops is cryptographically signed and the App software is distributed in advance. Also, an attacker that might e.g. try to sniff user's passwords by intercepting WiFi traffic could only be amongst a relatively small number of people in the intranet.

#### Certificate System
Simple passwords can easily be cracked, therefore HöGyCoin uses a system of certificate files that contain long arbitrary strings that serve as passwords. These files are included with the respective management client packets, so it has to be made sure that only the person on the computer running the management software has access to the files (e.g. only listen for requests on the loopback interface, not on any public interface). If a certificate got stolen, they can easily be regenerated. The server only stores hashes and compares them.

# Other notes

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

