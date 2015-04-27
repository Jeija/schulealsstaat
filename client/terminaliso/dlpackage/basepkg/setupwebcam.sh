#!/bin/bash

### Determine Webcam feed to use ###
set +e
AVAILABLE=$(find /dev/video*)
NONEFOUND=$?
set -e

while [ -z "$FEED" ]; do
	# Use qrreader0 webcam if available
	if [ -e /dev/qrreader0 ]; then
		FEED=/dev/qrreader0

	# Check if other webcams are available
	elif [ $NONEFOUND = 0 ]; then
		FEED=/dev/video1

		# Make dialog out of available devices
		LIST=()
		while read -r line; do
			LIST+=("$line $line")
		done <<< "$AVAILABLE"

		# Show dialog
		exec 3>&1
		FEED=$(dialog --title "Choose Webcam" --menu "Cancel to reload" 15 80 8 ${LIST[@]} 2>&1 1>&3)
		exec 3>&-

	# No other camera available --> ignore
	else
		dialog --msgbox "Could not find any webcam, ignoring." 8 50
		FEED="ignore"
	fi
done

echo "$FEED" > /tmp/webcam
