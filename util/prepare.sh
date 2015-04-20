#!/bin/bash
# Cryptography, file copying etc. only!

# Abort if run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

set -xe

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."

# Generate RSA public and private keys and store them
rm -f $ROOT/server/api/privkey.pem
openssl genrsa -rand /dev/urandom -out $ROOT/server/api/privkey.pem 1024
PUBKEY=$( openssl rsa -pubout -in $ROOT/server/api/privkey.pem )
echo -e "Generated RSA public key:\n$PUBKEY"
echo -ne "$PUBKEY" > $ROOT/client/adminpanel/site/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/client/app/www/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/client/entrycheck/site/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/client/registration/site/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/client/userterminal/site/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/client/genrequest/site/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/testing/api/pubkey.pem
echo -ne "$PUBKEY" > $ROOT/testing/autotest/pubkey.pem

# Generate certificates
$ROOT/util/gencert.sh

# Copy api.js to all client applications that use it
cp $ROOT/client/common/api.js $ROOT/client/userterminal/site/
cp $ROOT/client/common/api.js $ROOT/client/registration/site/
cp $ROOT/client/common/api.js $ROOT/client/genrequest/site/
cp $ROOT/client/common/api.js $ROOT/client/adminpanel/site/
cp $ROOT/client/common/api.js $ROOT/client/entrycheck/site/
cp $ROOT/client/common/api.js $ROOT/client/app/www/js/
cp $ROOT/client/common/api.js $ROOT/testing/api/
cp $ROOT/client/common/api.js $ROOT/testing/autotest/

# Copy cert.js + logging.js to all server applications that use it
cp $ROOT/server/common/cert.js $ROOT/server/api/cert.js
cp $ROOT/server/common/cert.js $ROOT/server/webcam/cert.js
cp $ROOT/server/common/cert.js $ROOT/server/proxy/internet/cert.js
cp $ROOT/server/common/logging.js $ROOT/server/api/logging.js
cp $ROOT/server/common/logging.js $ROOT/server/webcam/logging.js
cp $ROOT/server/common/logging.js $ROOT/server/proxy/internet/logging.js
cp $ROOT/server/common/logging.js $ROOT/server/proxy/intranet/logging.js
