#!/bin/bash
set -e
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."

type xxd >/dev/null 2>&1 || {
	echo >&2 "Command xxd is not installed, cannot generate certificates. Aborting.";
	exit 1;
}

# Certificate length in bytes
REGISTRATION_CERT_LEN=512
MASTER_CERT_LEN=1024
ADMIN_CERT_LEN=512
EC_CERT_LEN=256
WEBCAM_CERT_LEN=128

# Hash function
HASHFUNC="sha256sum | head -c 64"

# Generate Registration certificate + hash
echo -ne "Generating registration certifiacte + hash [..]"
REGISTRATION_CERT=$(xxd -l $REGISTRATION_CERT_LEN -p /dev/urandom | tr -d "\n")
REGISTRATION_HASH=$(echo -n "$REGISTRATION_CERT" | eval $HASHFUNC)
echo -e "\b\b\bOK]"

# Generate Webcam certificate + hash
echo -ne "Generating webcam certifiacte + hash [..]"
WEBCAM_CERT=$(xxd -l $WEBCAM_CERT_LEN -p /dev/urandom | tr -d "\n")
WEBCAM_HASH=$(echo -n "$WEBCAM_CERT" | eval $HASHFUNC)
echo -e "\b\b\bOK]"

# Generate Master certificate + hash
echo -ne "Generating master certifiacte + hash       [..]"
MASTER_CERT=$(xxd -l $MASTER_CERT_LEN -p /dev/urandom | tr -d "\n")
MASTER_HASH=$(echo -n "$MASTER_CERT" | eval $HASHFUNC)
echo -e "\b\b\bOK]"

# Generate Admin certificate + hash
echo -ne "Generating admin Certifiacte + hash        [..]"
ADMIN_CERT=$(xxd -l $ADMIN_CERT_LEN -p /dev/urandom | tr -d "\n")
ADMIN_HASH=$(echo -n "$ADMIN_CERT" | eval $HASHFUNC)
echo -e "\b\b\bOK]"

# Generate Entrycheck certificate + hash
echo -ne "Generating EC certifiacte + hash           [..]"
EC_CERT=$(xxd -l $EC_CERT_LEN -p /dev/urandom | tr -d "\n")
EC_HASH=$(echo -n "$EC_CERT" | eval $HASHFUNC)
echo -e "\b\b\bOK]"

# Save all hashes to their destinations
echo -ne "Saving all hashes to files                 [..]"
API_CERT_DIR=$ROOT/server/api/cert
WEBCAMSERV_CERT_DIR=$ROOT/server/webcam/cert
mkdir -p $API_CERT_DIR
mkdir -p $WEBCAMSERV_CERT_DIR
echo "$REGISTRATION_HASH" > $API_CERT_DIR/registration_hash
echo "$MASTER_HASH" > $API_CERT_DIR/master_hash
echo "$ADMIN_HASH" > $API_CERT_DIR/admin_hash
echo "$EC_HASH" > $API_CERT_DIR/ec_hash
echo "$WEBCAM_HASH" > $WEBCAMSERV_CERT_DIR/webcam_hash
echo -e "\b\b\bOK]"

# Save all certificates to their destinations
echo -ne "Saving all certificates to files           [..]"
AUTOTEST_CERT_DIR=$ROOT/testing/autotest/cert
mkdir -p $AUTOTEST_CERT_DIR
echo "$EC_CERT" > $AUTOTEST_CERT_DIR/ec_cert
echo "$ADMIN_CERT" > $AUTOTEST_CERT_DIR/admin_cert
echo "$MASTER_CERT" > $AUTOTEST_CERT_DIR/master_cert
echo "$REGISTRATION_CERT" > $AUTOTEST_CERT_DIR/registration_cert

REGISTRATION_CERT_DIR1=$ROOT/client/registration/site/cert
REGISTRATION_CERT_DIR2=$ROOT/client/adminpanel/site/cert
mkdir -p $REGISTRATION_CERT_DIR1
mkdir -p $REGISTRATION_CERT_DIR2
echo "$REGISTRATION_CERT" > $REGISTRATION_CERT_DIR1/registration_cert
echo "$REGISTRATION_CERT" > $REGISTRATION_CERT_DIR2/registration_cert

MASTER_CERT_DIR=$ROOT/util/cert
mkdir -p $MASTER_CERT_DIR
echo "$MASTER_CERT" > $MASTER_CERT_DIR/master_cert

ADMINPANEL_CERT_DIR=$ROOT/client/adminpanel/site/cert
mkdir -p $ADMINPANEL_CERT_DIR
echo "$ADMIN_CERT" > $ADMINPANEL_CERT_DIR/admin_cert

EC_CERT_DIR=$ROOT/client/entrycheck/www/cert
mkdir -p $EC_CERT_DIR
echo "$EC_CERT" > $EC_CERT_DIR/ec_cert

WEBCAM_CERT_DIR_ADM=$ROOT/client/adminpanel/site/cert
mkdir -p $WEBCAM_CERT_DIR_ADM
echo "$WEBCAM_CERT" > $WEBCAM_CERT_DIR_ADM/webcam_cert

WEBCAM_CERT_DIR_EC=$ROOT/client/entrycheck/www/cert
mkdir -p $WEBCAM_CERT_DIR_EC
echo "$WEBCAM_CERT" > $WEBCAM_CERT_DIR_EC/webcam_cert

echo -e "\b\b\bOK]"
echo "DONE!"
