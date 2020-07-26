# ZKStats: Teams edition

Simply fetches battle detail pages and shows when battles are happening. No sim processing happens at this time.
Battle duration is at it is shown on a detail page. Any rounding to turn this into a "human friendly" duration like "3 hours" carries over to our display.

# Installation

```
adduser --system --home /var/lib/zkteams --no-create-home --group zkteams
git clone https://github.com/esainane/zkstats-teams zkteams
chgrp zkteams demos public/data
chmod g+w demos public/data
ln -s /var/lib/zkteams/sd/zkstats-teams.service /etc/systemd/system
ln -s /var/lib/zkteams/sd/zkstats-teams.timer /etc/systemd/system
systemctl daemon-reload
```

Permit zkteams through the firewall on HTTPS outbound. When done, start the process manually for verification:

```
systemctl start zkstats-teams
```

```
systemctl enable zkstats-teams.timer
systemctl start zkstats-teams.timer
```

Point your webserver at the `/var/lib/zkteams/public/` directory to begin serving.
