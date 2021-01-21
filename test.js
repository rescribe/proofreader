/* Test the titletobbox() function */
function testtitletobbox() {
	var cases = [
		{"name": "tesseract ocr_line example",
		 "in": "bbox 559 1651 2429 1740; textangle 180; x_size 86; x_descenders 22; x_ascenders 23",
		 "out": {x: 559, y: 1651, width: 1870, height: 89}},
		{"name": "tesseract ocrx_word example",
		 "in": "bbox 1936 1902 2173 1990; x_wconf 92",
		 "out": {x: 1936, y: 1902, width: 237, height: 88}},
		{"name": "tesseract ocr_carea example",
		 "in": "bbox 552 560 2451 3801",
		 "out": {x: 552, y: 560, width: 1899, height: 3241}},
		{"name": "tesseract ocr_page example",
		 "in": 'image "/tmp/t.png"; bbox 0 0 3456 4677; ppageno 0',
		 "out": {x: 0, y: 0, width: 3456, height: 4677}}
	]

	var err = ""

	for(let i of cases) {
		let out = titletobbox(i.in)
		if(JSON.stringify(out) != JSON.stringify(i.out)) {
			err += "titletobbox(): error in case '" + i.name + "'\n" +
			       "               expected: " + JSON.stringify(i.out) + "\n" +
			       "               got     : " + JSON.stringify(out) + "\n"
		}
	}

	return err
}

/* Runs all tests requiring DOM manipulation */
function rundomtests(document) {
	// TODO: load .hocr and images from testfiles/
	// TODO: add tests here
	return ''
}

/* Run all tests and return any errors, or an empty string if all
 * tests pass */
function runalltests() {
	var err = ""

	err += testtitletobbox()
	err += domtestsetup()

	return err
}

/* If in browser, just call rundomtests(), otherwise set up the
 * nodejs libraries jsdom and fs, load proofreader.html into a
 * dom, and call rundomtests() with it. Returns an empty string
 * on success, or the error message on failure. */
function domtestsetup() {
	if(inbrowser()) {
		return rundomtests(document)
	}

	try {
		var fs = require('fs')
	} catch(e) {
		console.log('Skipping DOM tests as fs library could not be loaded (is nodejs installed?)')
		return ''
	}

	try {
		var jsdom = require('jsdom')
	} catch(e) {
		console.log('Skipping DOM tests as jsdom library could not be loaded (is node-jsdom installed?)')
		return ''
	}

	try {
		var d = fs.readFileSync('proofreader.html', 'utf8')
	} catch(e) {
		return 'Error reading proofreader.html for DOM tests'
	}

	const { JSDOM } = jsdom
	const { window } = new JSDOM(d)
	return rundomtests(window.document)
}

/* Tests whether this javascript is being run from a browser */
function inbrowser() {
	try {
		if(typeof document !== 'undefined') {
			return 1
		}
	} catch(e) {
	}

	return 0
}

/* Run tests and print the results to the console */
function termstart() {
	var err = runalltests()
	if(err == "") {
		console.log("All tests passed")
	} else {
		console.log(err)
	}
}

/* Run tests and print the results to a new pre element */
function browserstart() {
	var pre = document.createElement('pre')
	var pad = 'padding: 1ex 1em;'

	var err = runalltests()
	if(err == "") {
		pre.textContent = 'All tests passed'
		pre.style = pad + 'background-color: #ccffcc'
	} else {
		pre.textContent = err
		pre.style = pad + 'background-color: #ffcccc'
	}

	var f = document.getElementById('footer')
	document.body.insertBefore(pre, f)

	do {
		f.style = 'display: none'
	} while((f = f.nextSibling) != null)
}

if(!inbrowser()) {
	termstart()
}
