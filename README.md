## Only notes, complete README is TODO

### IPs
* 192.168.2.100 - 192.168.30.250 for clients
* 192.168.2.10: Network management server, consisting of:
  - DHCP Server
  - DNS Server
  - DNS blocking redirect server, non-internal domain DNS requests will be redirected to this server, displays STOP!-sign

  These servers can optionally be split up to run on multiple machines, having all of them on the same machine is easier for development though.

* 192.168.2.30: API Server
* 192.168.2.31: Passport Picture Server (webcamserver)
* 192.168.2.40: Client-facing central bank web portal website

### Internet Filtering
Userterminals will create their wifi networks using the script in `network/wifi/wifi.sh`.
They must `ebtables-restore < ebtables.save` (`ebtables.save` is in `network/wifi`) immediately after setting up their WiFi access point.
