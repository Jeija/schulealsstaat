#!/bin/bash
# Generate SSH keypair for sshd on the userterminals + GPG keypair for the packages
set -e

######## GPG ########
echo "Generating GPG keypair, enter the password to protect the GPG private key:"
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

EMAIL=cag@mesecons.net

gpg --yes --delete-secret-key $EMAIL || true
gpg --yes --delete-key $EMAIL || true

cat > /tmp/gpg_terminalkey <<EOF
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

gpg --batch --gen-key /tmp/gpg_terminalkey
gpg --armor --output $CWD/iso/airootfs/root/packetkey.pub --export $EMAIL

######## SSH ########
echo "Generating SSH keypair, enter the password to protect the SSH private key:"
ssh-keygen -t rsa -f /tmp/userterminal_ssh_key
mkdir -p $CWD/iso/airootfs/root/.ssh
mkdir -p $CWD/iso/out
cp /tmp/userterminal_ssh_key.pub $CWD/iso/airootfs/root/.ssh/authorized_keys
mv /tmp/userterminal_ssh_key $CWD/iso/out
