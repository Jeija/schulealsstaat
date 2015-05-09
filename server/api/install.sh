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

[Address]
Address=$PUBLIC_IP/$PUBLIC_SUBNET
EOF

# Private
cat << EOF > /etc/systemd/network/private.network
[Match]
Name=$PRIVATE_IFACE

[Address]
Address=$PRIVATE_IP/$PRIVATE_SUBNET
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

# Enable systemd services
systemctl disable dhcpcd -q || true
systemctl disable NetworkManager -q || true
systemctl enable systemd-networkd
systemctl enable sas_api

if [ -n "$GATEWAY_ADDR" ]; then
	systemctl enable sas_gateway
fi

echo "All done! You might need to configure /opt/api/settings.js"
echo "(make sure the database server address is correct)"
echo "Also, in order to use the online gateway, copy your private"
echo "SSH key for it to /opt/id_rsa_proxy and configure the server"
echo "(no timeout, GatewayPorts yes)"
echo
echo "When that is done, reboot!"
