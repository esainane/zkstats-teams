#!/bin/bash

set -e

mm1v1url="https://zero-k.info/Battles?Title=MM+&Map=&PlayersFrom=2&PlayersTo=2&Age=0&Mission=2&Bots=2&Rank=8&Victory=0&Offset="
teamsurl="https://zero-k.info/Battles?Title=[A]+Teams+All+Welcome&Map=&PlayersFrom=&PlayersTo=&Age=0&Mission=2&Bots=2&Rank=8&Victory=0&Offset="

main() {
    local start="$1"
    local end="$2"
    while read offset; do
        curl -s "$teamsurl$offset" | sed -n "s_^.*<a href='/Battles/Detail/\([0-9]\+\)'.*\$_\1_p"
        sleep 0.2
    done < <(seq "$start" 40 "$end") | paste -d\  -s - | sed 's/^/BATTLEIDS:=/' > demos/index.mk.tmp
    mv -f demos/index.mk.tmp demos/index.mk.in
    mv -f demos/index.mk.in demos/index.mk
    make timeline
}

if [ $# -lt 2 ]; then
  echo "Usage: $0 REPLAYS-OFFSET REPLAYS-AMOUNT"
  echo "Updates the replay index."
  echo
  echo "Will be rounded up to the nearest multiple of 40, as that is what the"
  echo "website paginates by."
  exit 1
fi

main "$1" "$2"
