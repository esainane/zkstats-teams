include scrape.mk

-include demos/index.mk
# BATTLEIDS is the set of battle IDs that we can get from the index
RDETAILS:=$(addprefix demos/,$(addsuffix /detail.html, $(BATTLEIDS)))
RDETAILKVS:=$(addprefix demos/,$(addsuffix /detail.json, $(BATTLEIDS)))

demos: demos/index.mk fetch-details

.PHONY: all demos timeline fetch-details
.SECONDARY:

fetch-details: $(RDETAILS)

export getspringversion
export getzkversion
export gettitle
export getreplay
export getduration
export getteam1
export getteam2
export getspecs
demos/%/detail.json: demos/%/detail.html Makefile scrape.mk
	echo -n "{" > "$@.tmp"
	echo -n "\"MAPID\":$$(sed -n 's_^.*<a href="/Maps/Detail/\([0-9]\+\)".*$$_\1_p' "$<")," >> "$@.tmp"
	echo -n "\"SPRINGVERSION\":\"$$(sed -n "$${getspringversion}" "$<")\"," >> "$@.tmp"
	echo -n "\"ZKVERSION\":\"$$(sed -n "$${getzkversion}" "$<")\"," >> "$@.tmp"
	echo -n "\"TITLE\":\"$$(sed -n "$${gettitle}" "$<")\"," >> "$@.tmp"
	echo -n "\"REPLAY\":\"$$(sed -n "$${getreplay}" "$<")\"," >> "$@.tmp"
	# All I want for christmas is an API that exposes a machine readable duration so that I can get something accurate without having to run a full replay sim
	# /Maybe/ you could do something with spring demotool to get a good approximation by timestamp of last command sent
	# In the meantime, y'all will have to just deal with any rounding the human readable duration does
	echo -n "\"DURATION\":\"$$(sed -n "$${getduration}" "$<")\"," >> "$@.tmp"
	echo -n "\"TEAM1\":[$$(sed -n "$${getteam1}" "$<" | paste -d, -s -)]," >> "$@.tmp"
	echo -n "\"TEAM2\":[$$(sed -n "$${getteam2}" "$<" | paste -d, -s -)]," >> "$@.tmp"
	echo -n "\"SPECS\":[$$(sed -n "$${getspecs}" "$<" | paste -d, -s -)]" >> "$@.tmp"
	echo "}" >> "$@.tmp"
	mv -f "$@.tmp" "$@"

demos/%/detail.html:
	mkdir -p "$(dir $@)" && cd "$(dir $@)" && curl -s "https://zero-k.info/Battles/Detail/$*" > detail.html
	sleep 0.2

public/data/timeline.json: $(RDETAILKVS)
	( echo -n [ && cat demos/*/detail.json | paste -s -d, - && echo ] ) > "$@.tmp"
	mv -f --backup=numbered "$@.tmp" "$@"

timeline: public/data/timeline.json
