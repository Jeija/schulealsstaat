## Only notes, complete README is TODO

### IPs
* 192.168.2.100 - 192.168.30.250 for clients
* 192.168.2.10: DHCP and DNS Server (if same machine, otherwise DHCP server on 192.168.2.9)
* 192.168.2.20: Internet blocking redirect server, displays STOP!-sign whenever people try to reach non-internal websites
* 192.168.2.30: API Server
* 192.168.2.31: Passport Picture Server (webcamserver)
* 192.168.2.40: Client-facing central bank web portal website

### Internet Filtering
Userterminals will create their wifi networks using the script in `network/wifi/wifi.sh`.
They must `ebtables-restore < ebtables.save` (`ebtables.save` is in `network/wifi`) immediately after setting up their WiFi access point.
