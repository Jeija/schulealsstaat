#!/bin/bash
# This script installs all required services and files for a
# working production network management server, wich runs
# DHCP, DNS, NTP, the walled garden / captive portal page
# and the package server.

set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

exec 3>&1
ETH_IFACE=$(dialog --nocancel --inputbox Ethernet\ Interface? 10 50 enp0s0 2>&1 1>&3)
IP_ADDR=$(dialog --nocancel --inputbox This\ IP? 10 50 192.168.2.10 2>&1 1>&3)
ALTERNATE=$(dialog --nocancel --inputbox Alternate\ server\ IP? 10 50 192.168.2.11 2>&1 1>&3)
SUBNET=$(dialog --nocancel --inputbox Subnet? 10 50 16 2>&1 1>&3)
DHCP_FAILOVER=$(dialog --nocancel --menu "DHCP Failover Rank" 10 30 3 primary Primary secondary Secondary 2>&1 1>&3)

exec 3>&-

# Disable old stuff
systemctl disable NetworkManager --quiet || true
systemctl disable dhcpcd --quiet || true
rm -f /etc/systemd/network/* || true

# Install new network configuration with systemd-networkd
cat << EOF > /etc/systemd/network/netbr.netdev
[NetDev]
Name=netbr
Kind=bridge
EOF

cat << EOF > /etc/systemd/network/$ETH_IFACE.network
[Match]
Name=$ETH_IFACE

[Network]
Bridge=netbr
EOF

cat << EOF > /etc/systemd/network/netbr.network
[Match]
Name=netbr

[Address]
Address=$IP_ADDR/$SUBNET
EOF

# DHCP configuration
cat << EOF > /etc/dhcpd.conf
authoritative;

failover peer "dhcp-failover" {
	$DHCP_FAILOVER;
	address $IP_ADDR;
	port 647;
	peer address $ALTERNATE;
	peer port 647;
	max-response-delay 60;
	max-unacked-updates 10;
	mclt 1800;
	split 128;
	load balance max seconds 3;
}

subnet 192.168.0.0 netmask 255.255.0.0 {
	option subnet-mask 255.255.0.0;
	option domain-name-servers $IP_ADDR, $ALTERNATE;
	pool {
		failover peer "dhcp-failover";
		max-lease-time 604800; # one week
		range 192.168.10.100 192.168.200.250;
	}
}
EOF

if [ $DHCP_FAILOVER == "secondary" ]; then
	# Remove mclt and split from dhcpd.conf
	sed -i "/mclt/d" /etc/dhcpd.conf
	sed -i "/split/d" /etc/dhcpd.conf
fi

# Install walled garden + DNS
cp -R $CWD/walledgarden /opt/walledgarden
cp -R $CWD/dns /opt/dns

# Always set own IP to primary in DNS, alternate IP as secondary:
TAB=$"\t"
sed -i "/primary.saeu/c\\"${TAB}"\"primary\.saeu\" : \""$IP_ADDR"\"," /opt/dns/lookup.json
sed -i "/secondary.saeu/c\\"${TAB}"\"secondary\.saeu\" : \""$ALTERNATE"\"," /opt/dns/lookup.json
sed -i "/__default/c\\"${TAB}"\"__default\" : \""$IP_ADDR"\"" /opt/dns/lookup.json

# Enable new configuration
cp $CWD/systemd-services/* /etc/systemd/system
systemctl enable systemd-networkd
systemctl enable sas_ntpd
systemctl enable sas_block_broadcast
systemctl enable sas_walledgarden
systemctl enable sas_dns
systemctl enable sas_dhcp
systemctl enable sas_packages

mkdir -p /opt/sas_terminal_packages
echo "##############################################################"
echo "Setup completetd. Please manually place terminal packages in"
echo "/opt/sas_terminal_packages for download! They can be generated"
echo "using schulealsstaat/client/terminaliso/dlpackage/genrepo.sh"
echo "All the files to copy can then be found in:"
echo "schulealsstaat/client/terminaliso/dlpackage/dlrepo"
echo -e "\nAfter that, reboot the system to start sas services."
