define mapmanualfallback
/Manual downloads:/{
n
s_^.*<a href='\([^']\+\)'.*$$_\1_p
}
endef

define getspringversion
/Engine version:/{
n
n
n
s_^ *\([-a-zA-Z0-9_.]\+\)$$_\1_p
}
endef

define getzkversion
/Game version:/{
n
n
n
s_^ *\([-a-zA-Z0-9_. ]\+\)$$_\1_p
}
endef

define gettitle
/Title:/{
n
n
n
s_ *\(.*\)$$_\1_p
}
endef

define getreplay
s_^.*<a href=./replays/\(.*\.sdfz\)'>Manual download</a>.*$$_\1_p
endef

define getduration
/Duration:/{
n
n
n
s_ *\([^ ].*\)$$_\1_p
}
endef

define getteam1
/Team 1 /,/<\/div>/{
s_^.*href=./Users/Detail/\([0-9]\+\). .*$$_\1_p
}
endef

define getteam2
/Team 1 /,/<\/div>/{
s_^.*href=./Users/Detail/\([0-9]\+\). .*$$_\1_p
}
endef

define getspecs
/Spectators/,/<\/div>/{
s_^.*href=./Users/Detail/\([0-9]\+\). .*$$_\1_p
}
endef
