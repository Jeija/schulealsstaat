#!/bin/bash
# Initializes environment for SaS server / client development, installs dependencies
# (Cordova init must be done seperately as it depends on the target platform)

# Abort if not run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

sudo npm install -g bower
sudo npm install -g http-server

# Install server dependencies
( cd server/api ; npm install )
( cd server/webcam ; npm install )

# Install client dependencies
( cd client/adminpanel/site ; bower install )
( cd client/app/www ; bower install )
( cd client/entrycheck/site ; bower install )
( cd client/registration/site ; bower install )
( cd client/userterminal/site ; bower install )

# Generate certificates
$CWD/util/gencert.sh

# Copy api.js to all client applications that use it
cp $CWD/client/common/api.js $CWD/client/userterminal/site/
cp $CWD/client/common/api.js $CWD/client/adminpanel/site/
cp $CWD/client/common/api.js $CWD/client/app/www/js/

