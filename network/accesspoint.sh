#!/bin/bash

set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

while [ ! -e /sys/class/net/saswifi0 ]
do
	cp $CWD/wifi/85-saswifi.rules /etc/udev/rules.d/
	udevadm control --reload
	dialog --msgbox "Could not find saswifi0, created udev rule. Please replug your RT5370 device to apply it and press OK." 8 50
done

# Kill anything that could interfere with this process
systemctl stop NetworkManager || true
service NetworkManager stop || true
killall dhcpcd || true
sleep 1

# Load ebtables and start WiFi
ebtables-restore < $CWD/wifi/ebtables.save
rfkill unblock wifi
rfkill unblock wlan
ip link set dev saswifi0 up
$CWD/wifi/wifi.sh
