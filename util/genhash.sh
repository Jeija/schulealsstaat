#!/bin/bash
cat $1 | tr -d "\n" | sha256sum
