#!/bin/bash
# This script sets up a bridge interface on the host PC
# that filters all IPv4 broadcast traffic.
# Then it sets up a DHCP server that (since IPv4 broadcast is blocked)
# only replies to unicast requests.

IP="192.168.2.10/16"
GATEWAY="192.168.0.2"
set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ETH_IFACE=$(find /sys/class/net/e* | sed "s/.*\///")
BR_IFACE=netbr

# Clean up old configuration
echo "Removing old configuration..."
systemctl stop NetworkManager || true
service NetworkManager stop || true
killall dhcpd || true
killall dhcpcd || true
ip link set dev $BR_IFACE down || true
ip link set dev $ETH_IFACE down || true
ip route flush all
ip addr flush dev $ETH_IFACE
brctl delbr $BR_IFACE || true

# Create new network configuration
echo "Creating bridge interface $BR_IFACE to block DHCP broadcast..."
brctl addbr $BR_IFACE
brctl addif $BR_IFACE $ETH_IFACE
ip link set up dev $BR_IFACE
ip link set up dev $ETH_IFACE
ip addr add dev $BR_IFACE $IP
ip addr add dev $BR_IFACE 192.168.0.100/16 # just for development
ip addr add dev $BR_IFACE 192.168.2.11/16 # ntp.saeu
ip addr add dev $BR_IFACE 192.168.2.70/16 # mongodb1.saeu
ip addr add dev $BR_IFACE 192.168.2.30/16 # api.saeu
ip addr add dev $BR_IFACE 192.168.2.60/16 # cam.saeu
ip addr add dev $BR_IFACE 192.168.2.32/16 # packages.saeu
ip addr add dev $BR_IFACE 192.168.2.40/16 # centralbank.eu (just testing)
ip addr add dev $BR_IFACE 192.168.2.50/16 # radio.saeu
ip addr add dev $BR_IFACE 10.10.5.10/8 # Primary database server
ip route add default via $GATEWAY
ebtables --flush
ebtables -I INPUT -p ipv4 --ip-dst 255.255.255.255 -j DROP

# Start DHCP + DNS Server + Walled Garden + NTP
echo "Starting DHCP + DNS + Walled Garden + NTP Server"
cp $CWD/dhcp/dhcpd.conf /etc/dhcpd.conf
SESSION="SaEUnet"
tmux -2 new-session -d -s "$SESSION"
tmux rename-window "SaEU Network Management"
tmux split-window -h -p 75
tmux split-window -h -p 67
tmux split-window -h
tmux select-pane -t 0
sleep 0.5
tmux send-key "nodemon $CWD/walledgarden/server.js" C-m
tmux select-pane -t 1
sleep 0.5
tmux send-key "nodemon $CWD/dns/main.js" C-m
tmux select-pane -t 2
sleep 0.5
tmux send-key "sudo dhcpd -4 -d" C-m
tmux select-pane -t 3
sleep 0.5
tmux send-key "$CWD/ntp/ntp.sh" C-m
tmux set-option mode-mouse on
tmux set-option mouse-select-pane on
tmux set-option mouse-resize-pane on
tmux set-option mouse-select-window on
tmux -2 attach-session -t "$SESSION"
