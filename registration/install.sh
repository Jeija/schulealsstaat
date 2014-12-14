#!/bin/bash

# Abort if not run as root
if [ $(id -u) -ne 0 ]
then
	echo "This script must be run as root. Aborting."
	exit 1
fi

npm install http-server -g
