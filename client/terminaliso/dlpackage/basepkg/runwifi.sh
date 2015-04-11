#!/bin/bash

# NoWifi packages: exit
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -e $CWD/disable_wifi ]; then
	echo "WiFi disabled by package"
	exit
fi

echo "Starting runwifi.sh"
WIFI_IFACE=$(cat /tmp/wifi/iface)
TXPOWER=$(cat /tmp/wifi/txpower)
killall hostapd -9 > /dev/null 2>&1 || true

alarm() {
	speaker-test -t sine -f 1500 > /dev/null 2>&1 & pid=$!
	trap "kill -9 $pid 2>/dev/null || true" EXIT
	sleep 0.3
	kill -9 $pid
	wait $pid 2>/dev/null
	sleep 1
}

check_interface() {
	# If interface does not exist, beep until it is back
	sleep 1
	while [ ! -e /sys/class/net/$WIFI_IFACE ]; do
		echo "Interface was removed!"
		alarm
	done
}

check_interface
while true; do
	rfkill unblock wifi
	iw dev $WIFI_IFACE set txpower fixed "$TXPOWER"
	hostapd /tmp/hostapd.conf | tee >(while read l ; do
		echo "$l" | grep "INTERFACE-DISABLED\|send\ failed"
		if [ $? = 0 ]; then
			check_interface
			killall hostapd -9 || true
		fi
	done)
	alarm
done
