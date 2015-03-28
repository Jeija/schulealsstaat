#!/bin/bash

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WIFI_IFACE=saswifi0
BR_IFACE=netbr

### Networking ###
exec 3>&1
WIFI_CHANNEL=$(dialog --nocancel --inputbox WiFi\ Channel? 10 50 6 2>&1 1>&3)
DHCPSERVER=$(dialog --nocancel --inputbox DHCP\ Server? 10 50 192.168.2.10 2>&1 1>&3)
TXPOWER=$(dialog --nocancel --inputbox TX\ Power\ \(mdBm\)? 10 50 100 2>&1 1>&3)
exec 3>&-

# Some debug output..
lsusb
ip addr

iw dev $WIFI_IFACE set txpower fixed "$TXPOWER"

### Userterminal ###
mkdir -p /tmp/userterminal
cp -R $CWD/userterminal/* /tmp/userterminal
cp $CWD/xinitrc /root/.xinitrc

### tmux: dhcrelay, hostapd, nw.js ###
echo "Starting dhcrelay + hostapd + nw.js"
SESSION="SaEUTerminal"
tmux -2 new-session -d -s "$SESSION"
tmux rename-window "SaEU Admin Console"
tmux split-window -h
tmux select-pane -t 0
sleep 1.0
tmux send-key "dhcrelay -4 -d -i $BR_IFACE $DHCPSERVER" C-m
tmux select-pane -t 1
sleep 1.0
#tmux send-key "TODO hostapd script" C-m

startx
