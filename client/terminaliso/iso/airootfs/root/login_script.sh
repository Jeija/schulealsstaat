#!/bin/bash

# Set up Ethernet connection with bridge, NO WiFi configuration etc.
# WiFi setup may require user input or supervision --> after auto-login 
ebtables-restore < /root/ebtables.save
rfkill unblock wifi

# Make bridge interface and connect ethernet to it
BRIDGE_IFACE=br0
ETH_IFACE=$(find /sys/class/net/e* | sed "s/.*\///")

brctl addbr $BRIDGE_IFACE
brctl addif $BRIDGE_IFACE $ETH_IFACE
ip link set up dev $BRIDGE_IFACE
ip link set up dev $ETH_IFACE

# Start DHCP client to retrieve IP address, from own DHCP server
# (original DHCP server has been blocked using ebtables)
dhcpcd

PACKAGESERVER="http://packages.saeu:100"

# Countdown
echo -n "Starting CentralBank Scripts [3s]"
sleep 1
echo -ne "\b\b\b2s]"
sleep 1
echo -ne "\b\b\b1s]"
sleep 1
echo -e "\b\b\b0s]"

set -e

echo "Importing GPG Public Key for Signature Checking"
gpg --import /root/packetkey.pub
gpg --list-keys

# Download list + let user select profile
echo "Downloading Centralbank Software List"
PKGLIST=$(curl $PACKAGESERVER/list)
echo $PKGLIST

DIALOGLIST=()
while read -r line; do
	DIALOGLIST+=("$line")
done <<< "$PKGLIST"

dialog --title "Select Profile Package" --menu "Available software packages:" \
	15 80 8 "${DIALOGLIST[@]}" 2> /tmp/tpkg_selection

# Download package + verify
curl -f $PACKAGESERVER/$(cat /tmp/tpkg_selection) > /tmp/tpkg.pkg.gpg

set +e
gpg --verify /tmp/tpkg.pkg.gpg
if [ ! $? -eq 0 ]; then
	echo "FALSE cryptographic signature for download package!"
	echo "This can be caused by AN ATTACK ON THE SYSTEM"
	echo "or by broken downloads / misconfigured packages."
	echo "Make sure the Live-CD / USB PGP Public Key matches the"
	echo "Private Key the package was signed with!"
	echo "Aborting!"
	exit 1
fi
set -e

gpg --output /tmp/tpkg.pkg --yes --decrypt /tmp/tpkg.pkg.gpg

# Extract + run package
mkdir -p /tmp/tpkg
tar xvf /tmp/tpkg.pkg -C /tmp/tpkg
/tmp/tpkg/init.sh
