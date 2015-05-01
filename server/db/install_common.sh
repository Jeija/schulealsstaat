#!/bin/bash

set -e

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

### Disable transparent_hugepages ###
cat << EOF > /etc/systemd/system/disable_hp.service
[Unit]
Description=Disable transparent_hugepages (MongoDB)
Before=mongodb.service

[Service]
Type=oneshot
ExecStart=/bin/sh -c "/usr/bin/echo never | /usr/bin/tee /sys/kernel/mm/transparent_hugepage/enabled"
ExecStart=/bin/sh -c "/usr/bin/echo never | /usr/bin/tee /sys/kernel/mm/transparent_hugepage/defrag"

[Install]
WantedBy=multi-user.target
EOF

systemctl stop NetworkManager -q || true
systemctl disable NetworkManager -q || true
systemctl enable systemd-networkd
systemctl enable disable_hp.service
systemctl enable mongodb
systemctl enable sasdb_snapshot.timer

# In case installation has to be repeated or server has to be reconfigured to
# be the master / client --> copy installation files to hard drive
mkdir -p ~/sasdb_install
cp $CWD/* ~/sasdb_install
