#!/bin/bash

touch /tmp/password
CWD=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $CWD && nw .
