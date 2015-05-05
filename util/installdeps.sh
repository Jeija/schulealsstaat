#!/bin/bash
# Installation only, only use this once

# Abort if run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

set -xe

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."

# Install server dependencies
( cd $ROOT/server/api ; npm install --python=python2.7 )
( cd $ROOT/server/webcam ; npm install )

# Install network dependencies
( cd $ROOT/network/dns; sudo npm install )

# Install client dependencies
( cd $ROOT/client/adminpanel/site ; bower install )
( cd $ROOT/client/app/www ; bower install )
( cd $ROOT/client/entrycheck/www ; bower install )
( cd $ROOT/client/registration/site ; bower install )
( cd $ROOT/client/userterminal/site ; bower install )
( cd $ROOT/client/genrequest/site ; bower install )

# Install networking dependencies
( cd $ROOT/network/dns ; npm install )

# Workaround for missing libudev.so.0 on most systems, for nw.js
if [ ! -f /lib/x86_64-linux-gnu/libudev.so.0 ] && [ ! -f /lib/libudev.so.0 ]; then
	# Most debian-based systems
	if [ -f /lib/x86_64-linux-gnu/libudev.so.1 ]; then
		sudo ln -s /lib/x86_64-linux-gnu/libudev.so.1 /lib/x86_64-linux-gnu/libudev.so.0
	fi

	# Some other systems, like Archlinux
	if [ -f /lib/libudev.so.1 ]; then
		sudo ln -s /lib/libudev.so.1 /lib/libudev.so.0
	fi
fi
