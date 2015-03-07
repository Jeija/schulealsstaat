#!/bin/bash
# Dependencies: DNSMasq, http-server, tmux

set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

mkdir -p /mnt/pxe
umount /mnt/pxe || true
mount -o loop,ro $CWD/iso/out/sasterminal-*.iso /mnt/pxe

SESSION="SaEUpxe"
tmux -2 new-session -d -s "$SESSION"
tmux rename-window "SaEU PXE Server"
tmux split-window -h
tmux select-pane -t 0
tmux send-key "http-server /mnt/pxe -p 200" C-m
sleep 0.5
tmux select-pane -t 1
sleep 0.5
tmux send-key "dnsmasq -C $CWD/dnsmasq.pxe.conf -d" C-m
tmux set-option mode-mouse on
tmux set-option mouse-select-pane on
tmux set-option mouse-resize-pane on
tmux set-option mouse-select-window on
tmux -2 attach-session -t "$SESSION"
