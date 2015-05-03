#!/bin/bash

killall nw
CWD=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $CWD && nw .
