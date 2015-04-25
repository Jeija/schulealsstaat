#!/bin/bash

set -xe

if [ -z "$1" ]; then
	echo "You must specify the local URL of the API server to use"
	echo "Usage:"
	echo "  $ online_proxy_ssh.sh <apiurl>"
	echo "e.g. online_proxy_ssh.sh api.saeu"
	exit 1
fi

REMOTE_SERVER=centralbank.eu
REMOTE_USER=root
REMOTE_PORT=443
LOCAL_SERVER=$1
LOCAL_PORT=1230

ssh -R \*:$REMOTE_PORT:$LOCAL_SERVER:$LOCAL_PORT -N $REMOTE_USER@$REMOTE_SERVER
