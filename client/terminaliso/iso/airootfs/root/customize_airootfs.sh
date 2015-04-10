#!/bin/bash

set -e -u

echo "######################"
echo "customize_airootfs.sh"

# Remove unused packages from base install
pacman -Rns dhcpcd xfsprogs reiserfsprogs lvm2 --noconfirm

# Locale
sed -i 's/#\(de_DE\.UTF-8\)/\1/' /etc/locale.gen
locale-gen

ln -sf /usr/share/zoneinfo/Europe/Berlin /etc/localtime

# File permissions (e.g. for SSH)
cp -aT /etc/skel/ /root/
chmod 700 /root
chmod 700 /root/.ssh/
chmod 600 /root/.ssh/*
chown -R root /root/.ssh/
chgrp -R root /root/.ssh/

chmod 750 /etc/sudoers.d
chmod 440 /etc/sudoers.d/g_wheel

# Config files
sed -i "s/#Server/Server/g" /etc/pacman.d/mirrorlist
sed -i 's/#\(Storage=\)auto/\1volatile/' /etc/systemd/journald.conf
echo "PasswordAuthentication no" >> /etc/ssh/sshd_config

systemctl set-default multi-user.target
systemctl enable sshd

echo "if [ \$(tty) = \"/dev/tty1\" ]; then /root/login_script.sh; fi" >> /root/.bash_profile
chmod +x /root/.bash_profile

echo "######################"
