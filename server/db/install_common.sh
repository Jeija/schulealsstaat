#!/bin/bash

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

### Networking Setup
cat << EOF > /etc/systemd/network/wired.network
[Match]
Name=$ETH_IFACE

[Address]
Address=$SERVERIP/$SUBNET
EOF

### Snapshots Setup ###
### Service
cat << EOF > /etc/systemd/system/sasdb_snapshot.service
[Unit]
Description=SaEU (local) database snapshot creation
After=network.target

[Service]
User=root
ExecStart=/opt/dbsnapshot.sh

[Install]
WantedBy=multi-user.target
EOF

### Timer
cat << EOF > /etc/systemd/system/sasdb_snapshot.timer
[Unit]
Description=Make SaEU database snapshots every 3 minutes

[Timer]
OnBootSec=5min
OnCalendar=*:0/3
Unit=sasdb_snapshot.service

[Install]
WantedBy=multi-user.target  
EOF

### Copy snapshot script
cp $CWD/dbsnapshot.sh /opt/dbsnapshot.sh

systemctl stop NetworkManager
systemctl disable NetworkManager
systemctl enable systemd-networkd
systemctl enable mongodb
systemctl enable sasdb_snapshot.timer

# In case installation has to be repeated or server has to be reconfigured to
# be the master / client --> copy installation files to hard drive
mkdir -p ~/sasdb_install
cp $CWD/* ~/sasdb_install
