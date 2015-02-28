#!/bin/bash
# Cryptography, file copying etc. only!

# Abort if run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

set -xe

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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
echo -ne "$PUBKEY" > $CWD/testing/api/pubkey.pem

# Generate certificates
$CWD/util/gencert.sh

# Copy api.js to all client applications that use it
cp $CWD/client/common/api.js $CWD/client/userterminal/site/
cp $CWD/client/common/api.js $CWD/client/registration/site/
cp $CWD/client/common/api.js $CWD/client/genrequest/site/
cp $CWD/client/common/api.js $CWD/client/adminpanel/site/
cp $CWD/client/common/api.js $CWD/client/entrycheck/site/
cp $CWD/client/common/api.js $CWD/client/app/www/js/
cp $CWD/client/common/api.js $CWD/testing/api/
