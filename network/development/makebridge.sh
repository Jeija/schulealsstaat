#!/bin/bash
set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

BRIDGE_IFACE=br0
ETH_IFACE=$(find /sys/class/net/e* | sed "s/.*\///")

# Kill anything that could interfere with this process
systemctl stop NetworkManager || true
service NetworkManager stop || true
killall dhcpcd || true
sleep 1

# Delete any remaining network configuration
ip link set down dev $ETH_IFACE
ip link set down dev $BRIDGE_IFACE || true
brctl delbr $BRIDGE_IFACE || true
ip addr flush dev $ETH_IFACE
ip route flush all

echo "Setup:.."
# Set up bridge
brctl addbr $BRIDGE_IFACE
brctl addif $BRIDGE_IFACE $ETH_IFACE
ip link set up dev $BRIDGE_IFACE
ip link set up dev $ETH_IFACE
dhcpcd -4 $BRIDGE_IFACE
