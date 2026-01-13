#!/bin/bash
sudo docker run --rm -v /home/guy/MarketPulse:/backup postgres:16 pg_restore -d "postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/blog" --clean --if-exists --no-owner --no-privileges /backup/8-2-1stkare
