#!/bin/bash
# Set up Ethernet connection with bridge, NO WiFi configuration etc.
# WiFi setup may require user input or supervision --> after auto-login 

ebtables-restore < /root/ebtables.save
rfkill unblock wifi

# Make bridge interface and connect ethernet to it
BRIDGE_IFACE=br0
ETH_IFACE=$(find /sys/class/net/enp* | sed "s/.*\///")

brctl addbr $BRIDGE_IFACE
brctl addif $BRIDGE_IFACE $ETH_IFACE
ip link set up dev $BRIDGE_IFACE
ip link set up dev $ETH_IFACE

# Start DHCP client to retrieve IP address, from own DHCP server
# (original DHCP server has been blocked using ebtables)
dhcpcd
