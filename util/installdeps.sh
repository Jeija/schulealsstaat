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

# Debian-based distros
if type "apt-get" > /dev/null; then
	sudo apt-get update
	sudo apt-get -y install npm nodejs-legacy tmux
fi

# Arch-based distros
if type "pacman" > /dev/null; then
	sudo pacman -Sy nodejs tmux --noconfirm
fi

# Global NPM dependencies
npm config set python /usr/bin/python2
if ! type "bower" > /dev/null; then sudo npm install -g bower ; fi
if ! type "http-server" > /dev/null; then sudo npm install -g http-server ; fi
if ! type "node-gyp" > /dev/null; then sudo npm install -g node-gyp ; fi
if ! type "nodemon" > /dev/null; then sudo npm install -g nodemon ; fi
if ! type "nw" > /dev/null; then sudo npm install -g nw ; fi

# Install server dependencies
( cd $ROOT/server/api ; sudo npm install )
( cd $ROOT/server/webcam ; sudo npm install )

# Install client dependencies
( cd $ROOT/client/adminpanel/site ; bower install )
( cd $ROOT/client/app/www ; bower install )
( cd $ROOT/client/entrycheck/site ; bower install )
( cd $ROOT/client/registration/site ; bower install )
( cd $ROOT/client/userterminal/site ; bower install )
( cd $ROOT/client/genrequest/site ; bower install )

# Workaround for missing libudev.so.0 on most systems, for nodewebkit
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
