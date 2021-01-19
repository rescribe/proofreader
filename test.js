/* Test the titletobbox() function */
function testtitletobbox() {
	var cases = [
		{"name": "tesseract ocr_line example", "in": "bbox 559 1651 2429 1740; textangle 180; x_size 86; x_descenders 22; x_ascenders 23", "out": {x: 559, y: 1651, width: 1870, height: 89}},
		{"name": "tesseract ocrx_word example", "in": "bbox 1936 1902 2173 1990; x_wconf 92", "out": {x: 1936, y: 1902, width: 237, height: 88}},
		{"name": "tesseract ocr_carea example", "in": "bbox 552 560 2451 3801", "out": {x: 552, y: 560, width: 1899, height: 3241}},
		{"name": "tesseract ocr_page example", "in": 'image "/tmp/1708_HARTSOEKER_SuiteDesConjecturesPhysiques/0032_bin0.4.png"; bbox 0 0 3456 4677; ppageno 0', "out": {x: 0, y: 0, width: 3456, height: 4677}}
	]

	var errors = ""

	for(let i of cases) {
		let out = titletobbox(i.in)
		if(JSON.stringify(out) != JSON.stringify(i.out)) {
			errors += "titletobbox(): error with " + i.name + "\n" +
			          "               expected: " + JSON.stringify(i.out) + "\n" +
			          "               got     : " + JSON.stringify(out) + "\n\n"
		}
	}

	return errors
}

/* Run all tests and return any errors, or an empty string if all pass */
function runtests() {
	var err = ""

	err += testtitletobbox()

	return err
}

/* Runs all tests and puts results in a #results HTML element */
function showtests() {
	var err = ""

	let results = document.getElementById('results')

	err = runtests()
	if(err != "") {
		results.style = 'background-color: #ffcccc'
		results.textContent = err
	} else {
		results.style = 'background-color: #ccffcc'
		results.textContent = 'All tests passed'
	}
}
