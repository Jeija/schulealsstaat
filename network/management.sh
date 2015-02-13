#!/bin/bash
IP="192.168.2.10/16"

set -e

if [ $# -eq 0 ]
then
	echo "Usage: management.sh [interface] [optional: gateway]"
	exit 1
fi

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

systemctl stop NetworkManager || true
service NetworkManager stop || true
killall dhcpd || true
killall dhcpcd || true
sleep 1

ip link set $1 up
ip addr flush dev $1
ip addr add "$IP" dev $1
cp $CWD/dhcp/dhcpd.conf /etc/dhcpd.conf
if [ -z "$2" ]
then
	echo "No gateway provided, not setting one up"
else
	echo "$2 is now your gateway"
	ip route add default via "$2"
fi

trap "kill 0" SIGINT SIGTERM EXIT

dhcpd
nodemon $CWD/illegal/server.js &
nodemon $CWD/dns/main.js
