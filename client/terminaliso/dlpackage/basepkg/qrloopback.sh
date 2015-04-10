#!/bin/bash

### Webcam Loopback on /dev/video20 ###
LOOPBACK_VIDEO=20
modprobe v4l2loopback video_nr="$LOOPBACK_VIDEO"

### Determine Webcam feed to use ###
if [ -e /dev/qrreader0 ]; then
	FEED=/dev/qrreader0
elif [ -e /dev/video1 ]; then
	FEED=/dev/video1
elif [ -e /dev/video0 ]; then
	FEED=/dev/video0
else
	dialog --msgbox "Could not find any webcam. Connect one and press ok." 8 50
	exec $0
fi

echo "Using webcam device $FEED"

while true; do
	ffmpeg -f v4l2 -i "$FEED" -vcodec copy -f v4l2 "/dev/video$LOOPBACK_VIDEO"
	sleep 0.5
done
