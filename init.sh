#!/bin/bash
# Initializes environment for SaS server / client development, installs dependencies
# (Cordova init must be done seperately as it depends on the target platform)

# Abort if run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

set -xe

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

npm config set python /usr/bin/python2
sudo npm install -g bower
sudo npm install -g http-server
sudo npm install -g node-gyp
sudo npm install -g nodemon
sudo npm install -g nw

# Generate RSA public and private keys and store them
rm -f $CWD/server/api/privkey.pem
openssl genrsa -rand /dev/urandom -out $CWD/server/api/privkey.pem 1024
PUBKEY=$( openssl rsa -pubout -in $CWD/server/api/privkey.pem )
echo -e "Generated RSA public key:\n$PUBKEY"
echo -ne "$PUBKEY" > $CWD/client/adminpanel/site/pubkey.pem
echo -ne "$PUBKEY" > $CWD/client/app/www/pubkey.pem
echo -ne "$PUBKEY" > $CWD/client/entrycheck/site/pubkey.pem
echo -ne "$PUBKEY" > $CWD/client/registration/site/pubkey.pem
echo -ne "$PUBKEY" > $CWD/client/userterminal/site/pubkey.pem
echo -ne "$PUBKEY" > $CWD/client/genrequest/site/pubkey.pem

# Install server dependencies
( cd $CWD/server/api ; sudo npm install )
( cd $CWD/server/webcam ; sudo npm install )

# Install client dependencies
( cd $CWD/client/adminpanel/site ; bower install )
( cd $CWD/client/app/www ; bower install )
( cd $CWD/client/entrycheck/site ; bower install )
( cd $CWD/client/registration/site ; bower install )
( cd $CWD/client/userterminal/site ; bower install )
( cd $CWD/client/genrequest/site ; bower install )

# Generate certificates
$CWD/util/gencert.sh

# Copy api.js to all client applications that use it
cp $CWD/client/common/api.js $CWD/client/userterminal/site/
cp $CWD/client/common/api.js $CWD/client/registration/site/
cp $CWD/client/common/api.js $CWD/client/genrequest/site/
cp $CWD/client/common/api.js $CWD/client/adminpanel/site/
cp $CWD/client/common/api.js $CWD/client/entrycheck/site/
cp $CWD/client/common/api.js $CWD/client/app/www/js/

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
