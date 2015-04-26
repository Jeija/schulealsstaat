#!/bin/bash
# Generate RSA public and private keys and store them
set -xe

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."

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
