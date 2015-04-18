#!/bin/bash
sudo ntpd -d -4 -I netbr -c /dev/null 127.127.1.1 | grep -v select
