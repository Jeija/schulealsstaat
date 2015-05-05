#!/bin/bash
function error
{
	echo "An error occured! Retrying in 10 seconds..."
	sleep 10
	exec $0
}
trap "error" ERR
trap "exec $0" EXIT
trap "exec $0" SIGINT
clear

exec 3>&1
NICK=$(dialog --nocancel --inputbox IRC\ Nick? 10 50 laptop 2>&1 1>&3)
exec 3>&-

while true; do
	irssi -n $NICK -c irc.saeu
done
