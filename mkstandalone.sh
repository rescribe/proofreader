#!/bin/sh
# This bundles the font in with the proofreader HTML to create one standalone .html

d=`dirname "$0"`
in="$d/proofreader.html"
out="$d/proofreader-standalone.html"
js="$d/proofreader.js"
css="$d/proofreader.css"
fn="$d/junicode.woff"
fnb64="${fn}.base64"

if test ! -f "$fnb64"; then
	base64 -w 0 < "$fn" > "$fnb64"
fi

font=`cat "$fnb64"`

(
# embed js
sed -n '1,/<meta/p' < "$in"
printf '<script type="text/javascript">\n'
cat "$js"
printf '</script>\n'

# embed font and css
printf '<style>\n'
printf '    @font-face { font-family: "Junicode"; src: url(data:application/x-font-woff;charset=utf-8;base64,'
cat "$fnb64"
printf ') format("woff"); }\n'
sed -n '2,$p' < "$css"
printf '</style>\n'
sed -n '/<\/head>/,$p' < "$in"
) > "$out"
