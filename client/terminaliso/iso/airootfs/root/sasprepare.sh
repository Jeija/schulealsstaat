#!/bin/bash

# Home router
arptables --append INPUT --destination-mac 44:32:C8:1B:19:8C -j DROP
arptables --append INPUT --source-mac 44:32:C8:1B:19:8C -j DROP
arptables --append OUTPUT --destination-mac 44:32:C8:1B:19:8C -j DROP
arptables --append OUTPUT --source-mac 44:32:C8:1B:19:8C -j DROP
arptables --append FORWARD --destination-mac 44:32:C8:1B:19:8C -j DROP
arptables --append FORWARD --source-mac 44:32:C8:1B:19:8C -j DROP

# Home AP
arptables --append INPUT --destination-mac 10:FE:ED:50:D0:00 -j DROP
arptables --append INPUT --source-mac 10:FE:ED:50:D0:00 -j DROP
arptables --append OUTPUT --destination-mac 10:FE:ED:50:D0:00 -j DROP
arptables --append OUTPUT --source-mac 10:FE:ED:50:D0:00 -j DROP
arptables --append FORWARD --destination-mac 10:FE:ED:50:D0:00 -j DROP
arptables --append FORWARD --source-mac 10:FE:ED:50:D0:00 -j DROP
