#!/bin/bash

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BR_IFACE=netbr

### Locale ###
localectl set-locale LANG=de_DE.UTF-8
localectl set-keymap de
localectl set-x11-keymap de

### Networking / Wireless ###
ebtables-restore < $CWD/ebtables.save
$CWD/setupwifi.sh
dialog --nocancel --inputbox Network\ Management\ Servers? 10 50 "net1.saeu net2.saeu" 2> /tmp/net_management
NETMANSERVERS=$(cat /tmp/net_management)

### Webcam ###
$CWD/setupwebcam.sh

# Some debug output..
lsusb
ip addr

### Userterminal ###
mkdir -p /tmp/userterminal
cp -R $CWD/userterminal/* /tmp/userterminal
cp $CWD/xinitrc /root/.xinitrc

### Root password and userterminal configuration password ###
dialog --insecure --passwordbox "Settings password?" 10 40 2> /tmp/password
PASS=$(cat /tmp/password)
echo "root:$PASS" | chpasswd

### Audio volume ###
amixer sset Master 100%

### TMUX interface:
# Look at it by invoking tmux attach-session
#  __________________________
# |            |             |
# |     0      |      2      |
# |  dhcrelay  |   hostapd   |
# |            |             |
# |____________|_____________|
# |            |             |
# |     1      |      3      |
# |   ffmpeg   |             |
# |            |             |
# |____________|_____________|

### tmux: dhcrelay, hostapd, nw.js ###
echo "Starting dhcrelay + hostapd + nw.js"
SESSION="SaEUTerminal"
tmux -2 new-session -d -s "$SESSION"
tmux rename-window "SaEU Admin Console"

# Setup Layout:
tmux split-window -h
tmux select-pane -t 0; sleep 0.5
tmux split-window -v
tmux select-pane -t 2; sleep 0.5
tmux split-window -v

# Execute commands:
# (0) dhcrelay
tmux select-pane -t 0; sleep 0.5
tmux send-key "dhcrelay -4 -d -i $BR_IFACE $NETMANSERVERS" C-m

# (1) ffmpeg
tmux select-pane -t 1; sleep 0.5
tmux send-key "$CWD/qrloopback.sh" C-m

# (2) hostapd
tmux select-pane -t 2; sleep 0.5
tmux send-key "$CWD/runwifi.sh" C-m

startx
