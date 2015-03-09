#!/bin/bash

set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

# Clean up (if executed previously)
ip link set dev br0 down || true
brctl delbr br0 || true
killall dhcpcd || true
sleep 1

# Make bridge interface
BRIDGE_IFACE=br0
ETH_IFACE=$(find /sys/class/net/enp* | sed "s/.*\///")

brctl addbr $BRIDGE_IFACE
brctl addif $BRIDGE_IFACE $ETH_IFACE
ip link set up dev $BRIDGE_IFACE
ip link set up dev $ETH_IFACE
dhcpcd -4

# Set up hostapd
rfkill unblock wlan
exec 3>&1
WIFI_CHANNEL=$(dialog --inputbox WiFi-Channel? 10 50 1 2>&1 1>&3)
exec 3>&-

cat << EOF > /tmp/hostapd.conf
ssid=saeu
interface=saswifi0
bridge=br0
channel=$WIFI_CHANNEL
driver=nl80211
EOF

hostapd /tmp/hostapd.conf
