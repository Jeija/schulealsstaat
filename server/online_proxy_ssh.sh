#!/bin/bash

# Install autossh from your repository to use this
# (e.g. pacman -S autossh)
# On the remote server append the following line to the file /etc/ssh/sshd_config
# 'GatewayPorts yes'
# And restart the SSH server
#
# You must also generate a 

set -e

if [ -z "$2" ]; then
	echo "You must specify the local URL of the API server to use"
	echo "and the SSH key to use."
	echo "Usage:"
	echo "  $ online_proxy_ssh.sh <apiurl> <sshkey>"
	echo "e.g. online_proxy_ssh.sh api.saeu ~/.ssh/id_rsa_saeuproxy"
	exit 1
fi

REMOTE_SERVER=centralbank.eu
REMOTE_USER=root
REMOTE_PORT=443
LOCAL_SERVER=$1
LOCAL_PORT=1230
SSH_KEYFILE=$2

autossh -M 20000 -N -R \*:$REMOTE_PORT:$LOCAL_SERVER:$LOCAL_PORT $REMOTE_USER@$REMOTE_SERVER -i $SSH_KEYFILE -v
