#!/bin/bash

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

FEED=$(cat /tmp/webcam)
if [ "$FEED" = "ignore" ]; then
	dialog --msgbox "Feed set to ignore. Enter to restart webcam setup." 8 50
	$CWD/setupwebcam.sh
	exec $0
fi

### Webcam Loopback on /dev/video20 ###
LOOPBACK_VIDEO=20
modprobe v4l2loopback video_nr="$LOOPBACK_VIDEO"

echo "Using webcam device $FEED"
while true; do
	ffmpeg -f v4l2 -i "$FEED" -f v4l2 "/dev/video$LOOPBACK_VIDEO"
	sleep 3
done
