all: proofreader-standalone.html

junicode.woff.base64: junicode.woff
	base64 -w 0 < junicode.woff > $@

proofreader-standalone.html: junicode.woff.base64 proofreader.css proofreader.html proofreader.js
	sed -n '1,/<meta/p' < proofreader.html > $@
	printf '<script type="text/javascript">\n' >> $@
	cat proofreader.js >> $@
	printf '</script>\n' >> $@
	printf '<style>\n' >> $@
	printf '    @font-face { font-family: "Junicode"; src: url(data:application/x-font-woff;charset=utf-8;base64,' >> $@
	cat junicode.woff.base64 >> $@
	printf ') format("woff"); }\n' >> $@
	sed -n '2,$$p' < proofreader.css >> $@
	printf '</style>\n' >> $@
	sed -n '/<\/head>/,$$p' < proofreader.html >> $@

test:
	cat proofreader.js test.js | js

.PHONY: all test