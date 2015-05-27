#!/bin/bash

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

tmux send-key "$CWD/registration/run.sh" C-m
tmux split-window -v -p 80
tmux send-key "$CWD/adminpanel/run.sh" C-m
tmux split-window -v -p 75
tmux send-key "$CWD/entrycheck/run.sh" C-m
tmux split-window -v -p 67
tmux send-key "$CWD/genrequest/run.sh" C-m
tmux split-window -v
tmux send-key "$CWD/business/run.sh" C-m
