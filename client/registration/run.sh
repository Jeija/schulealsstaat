#!/bin/bash

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
http-server $CWD/site -p 84
