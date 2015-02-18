#!/bin/bash

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$(pidof systemd)" ]; then
	systemctl start mongodb
fi

# Spawn Webcam and API Server in different tmux windows
tmux send-key "cd $CWD/webcam && nodemon main.js" C-m
tmux split-window -v
tmux send-key "cd $CWD/api && nodemon main.js" C-m
