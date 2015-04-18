#!/bin/bash
PKGSERVER="http://packages.saeu:100"
NTPSERVER="ntp.saeu"

function error
{
	echo "An error occured! Retrying in 10 seconds..."
	sleep 10
	exec $0
}
trap "error" ERR
trap "exec $0" EXIT
trap "exec $0" SIGINT
clear
rm -r /tmp/*

# Countdown
echo -n "Starting CentralBank Scripts [3s]"
sleep 1
echo -ne "\b\b\b2s]"
sleep 1
echo -ne "\b\b\b1s]"
sleep 1
echo -e "\b\b\b0s]"

# Make bridge interface and connect ethernet to it
BRIDGE_IFACE=netbr
ETH_IFACE=$(find /sys/class/net/e* | sed "s/.*\///")

# User input of required network information
exec 3>&1
IP=$(dialog --nocancel --inputbox IP\ Address? 10 50 192.168.5.1/16 2>&1 1>&3)
DNSSERVER=$(dialog --nocancel --inputbox DNS\ Server? 10 50 192.168.2.10 2>&1 1>&3)
exec 3>&-

# Setup Network
if [ ! -d /sys/class/net/$BRIDGE_IFACE ]; then
	brctl addbr $BRIDGE_IFACE
	brctl addif $BRIDGE_IFACE $ETH_IFACE
	ip link set up dev $BRIDGE_IFACE
	ip link set up dev $ETH_IFACE
	ip addr add dev $BRIDGE_IFACE $IP
fi
echo "nameserver $DNSSERVER" > /etc/resolv.conf

# Wait until network is up (connection to DNS server)
until ping -c 1 -w 2 $DNSSERVER; do
	ip link
	echo -e "\n\n\n--> No network connection! \n\n\n"
	sleep 1
done

# Synchronize time
echo -e "\n\n\nWaiting for NTP (time) synchronization from ntp.saeu / ntp2.saeu ...\n"
ntpd -gqc /dev/null -I $BRIDGE_IFACE -4 ntp.saeu ntp2.saeu
echo "Received time information:"
date
sleep 3

# Setup GnuPG Keys
echo "Importing GPG Public Key for Signature Checking"
gpg --import /root/packetkey.pub
gpg --list-keys

# Download list + let user select profile
echo "Downloading Centralbank Software List"
PKGLIST=$(curl $PKGSERVER/list)
echo $PKGLIST

DIALOGLIST=()
while read -r line; do
	DIALOGLIST+=("$line")
done <<< "$PKGLIST"

dialog --title "Select Profile Package" --nocancel --menu "Available software packages:" \
	15 80 8 "${DIALOGLIST[@]}" 2> /tmp/tpkg_selection

# Download package + verify
curl -f $PKGSERVER/$(cat /tmp/tpkg_selection) > /tmp/tpkg.pkg.gpg

trap - ERR
gpg --verify /tmp/tpkg.pkg.gpg
if [ ! $? -eq 0 ]; then
	echo "FALSE cryptographic signature for download package!"
	echo "This can be caused by AN ATTACK ON THE SYSTEM"
	echo "or by broken downloads / misconfigured packages."
	echo "Make sure the Live-CD / USB PGP Public Key matches the"
	echo "Private Key the package was signed with!"
	echo "Aborting!"
	error
fi
trap "error" ERR

gpg --output /tmp/tpkg.pkg --yes --decrypt /tmp/tpkg.pkg.gpg

# Extract + run package
mkdir -p /tmp/tpkg
tar xvf /tmp/tpkg.pkg -C /tmp/tpkg
/tmp/tpkg/init.sh
