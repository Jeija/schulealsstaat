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

# Generate certificates
$ROOT/util/gencert.sh

# Copy files to their appropriate destinations
$ROOT/util/copyfiles.sh

# Generate RSA keypair for encryped client-server communication
$ROOT/util/genkeys.sh
