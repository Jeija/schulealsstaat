#!/bin/bash
BRIDGE_IFACE=netbr

sudo bash -c "echo \"allow $BRIDGE_IFACE\" > /etc/qemu/bridge.conf"

qemu-system-x86_64 -m 1024 -enable-kvm -boot d -vga std -cdrom iso/out/sasterminal-* -net nic -net bridge,br=$BRIDGE_IFACE
