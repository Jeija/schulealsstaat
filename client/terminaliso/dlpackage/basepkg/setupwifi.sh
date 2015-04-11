#!/bin/bash

# NoWifi packages: exit
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -e $CWD/disable_wifi ]; then
	echo "WiFi disabled by package"
	exit
fi

# Determine which WiFi device to use
while [ -z "$WIFI_IFACE" ]; do
	# If connected, use saswifi0 interface (RT5370 USB WiFi donge)
	if [ -e /sys/class/net/saswifi0 ]; then
		WIFI_IFACE=saswifi0
	else
		# Give the choice to the user
		echo "No saswifi0 connected, please choose the wireless netork yourself"
		sleep 2
		{ iw dev; echo; iw phy; } | less
		# Get list of available wireless networks
		AVAILABLE=$(find /sys/class/net/w* | sed "s/.*\///")

		# Make dialog out of wireless networks list
		LIST=()
		while read -r line; do
			LIST+=("$line /dev/$line")
		done <<< "$AVAILABLE"

		echo "${LIST[@]}"
		# Show dialog
		exec 3>&1
		TITLE="Choose WiFi interface"
		MSTRING="Cancel to reload available interfaces, saswifi0 is default"
		WIFI_IFACE=$(dialog --title "$TITLE" --menu "$MSTRING" 15 80 8 ${LIST[@]} 2>&1 1>&3)
		exec 3>&-
	fi
done

exec 3>&1
WIFI_CHANNEL=$(dialog --nocancel --inputbox WiFi\ Channel? 10 50 6 2>&1 1>&3)
TXPOWER=$(dialog --nocancel --inputbox TX\ Power\ \(mdBm\)? 10 50 100 2>&1 1>&3)
exec 3>&-

# Save wifi properties to allow scripts to use them
mkdir -p /tmp/wifi
echo $WIFI_CHANNEL > /tmp/wifi/channel
echo $WIFI_IFACE > /tmp/wifi/iface
echo $TXPOWER > /tmp/wifi/txpower

cat << EOF > /tmp/hostapd.conf
ssid=saeu
interface=$WIFI_IFACE
channel=$WIFI_CHANNEL
bridge=netbr
driver=nl80211
EOF
