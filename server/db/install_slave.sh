#!/bin/bash

set -e

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "#########################"
echo "Slave server installation"
echo "#########################"
sleep 1.5

exec 3>&1
SERVERIP=$(dialog --nocancel --inputbox Slave\ IP? 10 50 10.10.5.11 2>&1 1>&3)
MASTERIP=$(dialog --nocancel --inputbox Master\ IP? 10 50 10.10.5.10 2>&1 1>&3)
ETH_IFACE=$(dialog --nocancel --inputbox Ethernet\ Interface? 10 50 enp2s0 2>&1 1>&3)
SUBNET=$(dialog --nocancel --inputbox Subnet? 10 50 8 2>&1 1>&3)
exec 3>&-

### Networking Setup
cat << EOF > /etc/systemd/network/wired.network
[Match]
Name=$ETH_IFACE

[Address]
Address=$SERVERIP/$SUBNET
EOF

### MongoDB Setup
cat << EOF > /etc/mongodb.conf
quiet = false
dbpath = /var/lib/mongodb
logpath = /var/log/mongodb/mongod.log
logappend = true
slave = true
source = $MASTERIP
EOF

$CWD/install_common.sh

echo "Slave installation completed, you should reboot now to activate the database."
