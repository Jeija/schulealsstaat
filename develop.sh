#!/bin/bash

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#!/bin/bash
SESSION="SaEU"

tmux -2 new-session -d -s "$SESSION"
tmux rename-window "Schule als EU"
tmux split-window -h
tmux select-pane -t 0
tmux send-key "$CWD/server/run.sh" C-m
sleep 0.1
tmux select-pane -t 2
sleep 0.1
tmux send-key "$CWD/client/run.sh" C-m
tmux set-option mode-mouse on
tmux set-option mouse-select-pane on
tmux set-option mouse-resize-pane on
tmux set-option mouse-select-window on
tmux -2 attach-session -t "$SESSION"
