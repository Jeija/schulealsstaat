#!/bin/bash

set -e
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

EMAIL=cag@mesecons.net

gpg --yes --delete-secret-key $EMAIL || true
gpg --yes --delete-key $EMAIL || true

cat >/tmp/terminalkey <<EOF
	%echo Generating OpenPGP key for terminal iso package distribution
	Key-Type: RSA
	Key-Length: 2048
	Subkey-Type: ELG-E
	Subkey-Length: 2048
	Name-Real: Computer AG
	Name-Email: $EMAIL
	Expire-Date: 0
	%commit
	%echo Done!
EOF

gpg --batch --gen-key /tmp/terminalkey
gpg --armor --output $CWD/../iso/airootfs/root/packetkey.pub --export $EMAIL
