#!/bin/bash

set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be executed as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "#######################"
echo "API server installation"
echo "#######################"
sleep 1.5

exec 3>&1
PUBLIC_IP=$(dialog --nocancel --inputbox Public\ IP? 10 50 192.168.2.30 2>&1 1>&3)
PUBLIC_IFACE=$(dialog --nocancel --inputbox Public\ Ethernet\ Interface? 10 50 enp2s0 2>&1 1>&3)
PUBLIC_SUBNET=$(dialog --nocancel --inputbox Public\ Subnet? 10 50 16 2>&1 1>&3)
PUBLIC_INTERNET_IP=$(dialog --nocancel --inputbox Public\ Internet\ IP? 10 50 192.168.0.30 2>&1 1>&3)
PUBLIC_INTERNET_SUBNET=$(dialog --nocancel --inputbox Public\ Internet\ Subnet? 10 50 23 2>&1 1>&3)
PUBLIC_GATEWAY=$(dialog --nocancel --inputbox Public\ Gateway? 10 50 192.168.1.1 2>&1 1>&3)

PRIVATE_IP=$(dialog --nocancel --inputbox Private\ IP? 10 50 10.10.0.100 2>&1 1>&3)
PRIVATE_IFACE=$(dialog --nocancel --inputbox Private\ Ethernet\ Interface? 10 50 enp5s0 2>&1 1>&3)
PRIVATE_SUBNET=$(dialog --nocancel --inputbox Private\ Subnet? 10 50 8 2>&1 1>&3)

GATEWAY_ADDR=$(dialog --nocancel --inputbox "Gateway Address  (blank=none)?" 10 50 frankfurt.centralbank.eu 2>&1 1>&3)
exec 3>&-

### Networking Setup
# Public
cat << EOF > /etc/systemd/network/public.network
[Match]
Name=$PUBLIC_IFACE

[Network]
Address=$PUBLIC_IP/$PUBLIC_SUBNET
Address=$PUBLIC_INTERNET_IP/$PUBLIC_INTERNET_SUBNET
DNS=8.8.8.8
EOF

# Private
cat << EOF > /etc/systemd/network/private.network
[Match]
Name=$PRIVATE_IFACE

[Address]
Address=$PRIVATE_IP/$PRIVATE_SUBNET
EOF

# Unfortunately, the gateway configuration in this situation will only allow
# IPs in the 192.168.0.0/23 subnet through. That's why the computer has to use
# a different source IP for going online.
cat << EOF > /etc/systemd/system/sas_patchroute.service
[Unit]
Description=SaS Patchroute
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/env ip route add default via $PUBLIC_GATEWAY src $PUBLIC_INTERNET_IP

[Install]
WantedBy=multi-user.target
EOF

### API setup
rm -rf /opt/api
cp -R $CWD /opt/api
cp -R $CWD/systemd-services/* /etc/systemd/system
cp $CWD/../online_proxy_ssh.sh /opt/sas_online_proxy_ssh.sh
chmod +x /opt/sas_online_proxy_ssh.sh

### Online gateway setup
cat << EOF > /etc/systemd/system/sas_gateway.service
[Unit]
Description=SaS Gateway SSH Tunnel
After=network.target

[Service]
TimeoutStartSec=0
ExecStart=/opt/sas_online_proxy_ssh.sh $GATEWAY_ADDR localhost /opt/id_rsa_proxy
Restart=always
RestartSec=1

[Install]
WantedBy=multi-user.target
EOF

### systemd-timesyncd NTP setup
cat << EOF > /etc/systemd/timesyncd.conf
[Time]
NTP=0.arch.pool.ntp.org 1.arch.pool.ntp.org 2.arch.pool.ntp.org 3.arch.pool.ntp.org
FallbackNTP=0.pool.ntp.org 1.pool.ntp.org 0.fr.pool.ntp.org
EOF

# Enable systemd services
systemctl disable dhcpcd -q || true
systemctl disable NetworkManager -q || true
systemctl enable systemd-networkd
systemctl enable sas_api
systemctl enable sas_patchroute
systemctl enable systemd-networkd-wait-online
timedatectl set-ntp true

if [ -n "$GATEWAY_ADDR" ]; then
	systemctl enable sas_gateway
fi

echo "All done! You might need to configure /opt/api/settings.js"
echo "(make sure the database server address is correct)"
echo "Also, in order to use the online gateway, copy your private"
echo "SSH key for it to /opt/id_rsa_proxy and configure the server"
echo "(no timeout, GatewayPorts yes)"
echo
echo "Then, manually connect to the gateway and check the fingerprint:"
echo "ssh root@$GATEWAY_ADDR"
echo
echo "When that is done, reboot!"
