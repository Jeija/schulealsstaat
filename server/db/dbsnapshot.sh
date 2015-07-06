#!/bin/bash

TIMESTAMP=$(date +"%F-%T-%N")
mkdir -p ~/sasdb_snapshots/
mongodump -o ~/sasdb_snapshots/$TIMESTAMP
echo "New backup with timestamp $TIMESTAMP completed!"
