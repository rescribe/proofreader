/* Copyright 2021 Nick White.
 * Use of this source code is governed by the AGPLv3
 * license that can be found in the LICENSE file. */

'use strict'

/* TODO:
 * - set the x_wconf css rules from js rather than a massive unweildy stylesheet
 *   and add test cases for this
 * - add a checkbox to disable a line, which is not included when saved
 * - create utility function to find a specific tag any level above current one,
 *   to use to navigate hocr reliably (e.g. to find the ocr_page that an element
 *   is in)
 */

const header = "<!DOCTYPE html><head><title></title><meta name='ocr-system' content='rescribe proofreader' /></head><body>"
const footer = "</body></html>"

/* titletobbox() parses a title tag to extract the bbox, returning an
 * object with origin coordinates, and width and height */
function titletobbox(title) {
	var start
	var end
	var fields = []
	var bbox = {}

	const bbfield = {
		"x1": 1,
		"y1": 2,
		"x2": 3,
		"y2": 4,
	}

	start = title.indexOf("bbox")
	end = title.substring(start).indexOf(";") + start
	if(end > start) {
		fields = title.substring(start, end).split(" ")
	} else {
		fields = title.substring(start).split(" ")
	}

	bbox.x = Number(fields[bbfield.x1])
	bbox.y = Number(fields[bbfield.y1])
	bbox.width = fields[bbfield.x2] - fields[bbfield.x1]
	bbox.height = fields[bbfield.y2] - fields[bbfield.y1]

	return bbox
}

/* titletoimgname() parses a title tag to extract the last part
 * of the image path */
function titletoimgname(title) {
	var start
	var end
	var path
	var quote

	quote = '"'
	if(title.indexOf(quote) == -1) {
		quote = "'"
	}
	start = title.indexOf('image ' + quote) + ('image ' + quote).length
	end = title.substring(start).indexOf(quote) + start
	if(end > start) {
		path = title.substring(start, end)
	} else {
		path = title.substring(start)
	}

	start = path.lastIndexOf("/") + "/".length

	return path.substring(start)
}

/* update the word title to 'corrected' so it can be styled differently */
function edited(event) {
	var p

	/* may be null if this has already been updated (e.g. if it's called more than once) */
	p = this.parentNode
	if(p == null) {
		return
	}

	if(!p.title.includes("corrected")) {
		p.title += "; corrected"
	}
}

/* key handler for word edit box */
function keyhandler(event) {
	if(event.key && event.key == "Tab" && event.shiftKey == false) {
		event.preventDefault()
		next(this)
	}

	if(event.key && event.key == "Tab" && event.shiftKey == true) {
		event.preventDefault()
		prev(this)
	}

	if(event.key && event.key == "ArrowDown") {
		down(this)
	}

	if(event.key && event.key == "ArrowUp") {
		up(this)
	}
}

/* open input box for the next word */
function next(c) {
	var e
	var p

	if((p = c.parentNode.nextSibling.nextSibling) == null) {
		return
	}

	/* dispatch 'click' event to open the next input box */
	e = new Event("click")
	p.dispatchEvent(e)
}

/* open input box for the previous word */
function prev(c) {
	var e
	var p

	/* dispatch 'click' event to open the next input box */
	if((p = c.parentNode.previousSibling.previousSibling) != null) {
		e = new Event("click")
		p.dispatchEvent(e)
	}
}

/* open input box for the first word on the line below the one
 * currently being edited */
function down(c) {
	var e
	var i
	var found
	var line
	var lines
	var word

	line = c.parentNode.parentNode
	if(line == null) {
		return
	}

	lines = document.getElementsByClassName("ocr_line")
	found = 0
	for(i = 0; i < lines.length; i++) {
		if(lines[i] == line) {
			found = 1
			break
		}
	}
	if(found == 0 || i >= lines.length - 1) {
		return
	}
	line = lines[i+1]

	word = line.firstChild
	while(word != null && word.tagName != "SPAN") {
		word = word.nextSibling
	}
	if(word == null) {
		return
	}

	/* dispatch 'click' event to open the next input box */
	e = new Event("click")
	word.dispatchEvent(e)
}

/* open input box for the first word on the line above the one
 * currently being edited */
function up(c) {
	var e
	var i
	var found
	var line
	var lines
	var word

	line = c.parentNode.parentNode
	if(line == null) {
		return
	}

	lines = document.getElementsByClassName("ocr_line")
	found = 0
	for(i = 0; i < lines.length; i++) {
		if(lines[i] == line) {
			found = 1
			break
		}
	}
	if(found == 0 || i == 0) {
		return
	}
	line = lines[i-1]

	word = line.firstChild
	while(word != null && word.tagName != "SPAN") {
		word = word.nextSibling
	}
	if(word == null) {
		return
	}

	/* dispatch 'click' event to open the next input box */
	e = new Event("click")
	word.dispatchEvent(e)
}


/* remove the input box and update the word */
function stopedit() {
	var p

	/* may be null if this has already been updated (e.g. if it's called more than once) */
	if((p = this.parentNode) == null) {
		return
	}
	p.innerHTML = this.value

	/* If no other input on the same line has been opened, then reset the
	 * line image. This check needs to be done as navigating with keyboard
	 * often results in next input being created (calling the edit() function
	 * which will reset and redraw the line image itself) before this one is
	 * stopped. */
	if(p.parentNode.getElementsByTagName("input").length == 0) {
		resetlineimg(p.parentNode)
	}

	p.addEventListener("click", edit)
}

/* ensure the whole word box is highlighted */
function selectall(event) {
	var a

	/* only do this if event was from a word movement key, as otherwise
	 * we'll get in the way of editing */
	if(event.key &&
	   (event.key != "Tab") &&
	   (event.key != "ArrowUp") &&
	   (event.key != "ArrowDown")) {
		return
	}

	a = document.getElementsByClassName("editword")

	if(a.length == 1) {
		a[0].selectionStart = 0
		a[0].selectionEnd = a[0].value.length
	}
}

/* replace the word with an input box with the word */
function edit() {
	var input
	var a
	var c
	var ctx
	var bbox
	var linebox
	var scaledown

	input = document.createElement("input")
	input.className = "editword"
	input.size = 1
	input.value = this.innerHTML.replace("&amp;", "&")

	input.addEventListener("input", edited)
	input.addEventListener("blur", stopedit)
	input.addEventListener("keydown", keyhandler)
	input.addEventListener("keyup", selectall)

	this.removeEventListener("click", edit)

	if(this.parentNode.parentNode.getElementsByTagName("canvas").length > 0) {
		resetlineimg(this.parentNode)
		c = this.parentNode.previousSibling
		ctx = c.getContext("2d")
		linebox = titletobbox(this.parentNode.title)
		bbox = titletobbox(this.title)
		scaledown = c.dataset.scaledown
		ctx.fillStyle = 'rgb(100, 190, 255, 0.5)';
		ctx.fillRect((bbox.x - linebox.x)/scaledown, (bbox.y - linebox.y)/scaledown, bbox.width/scaledown, bbox.height/scaledown)
	}

	this.innerHTML = ""
	this.appendChild(input)
	input.focus()
	input.selectionStart = 0
	input.selectionEnd = input.value.length
	input.style.width = (input.value.length * 0.8) + "em"
	if(input.value.length == 1) {
		input.style.width = "2em"
	}
}

/* save the hocr, minus the <canvas> elements we added for
 * proofreading, and adding a basic hocr header and footer */
function save() {
	var hocr
	var e

	e = document.getElementById("save")
	hocr = document.getElementById("hocr").innerHTML

	/* strip canvas tags that were inserted by proofreader */
	hocr = hocr.replaceAll(/<canvas.*?\/canvas>/g, "")

	/* strip img tags that were inserted by proofreader */
	hocr = hocr.replaceAll(/<img.*?>/g, "")

	/* replace &quot; with ' (there may be other cases where such replacements
	 * are necessary, or a better place to do this) */
	hocr = hocr.replaceAll(/&quot;/g, "'")

	e.href = "data:application/octet;charset=utf-8,"
	         + encodeURIComponent(header)
	         + encodeURIComponent(hocr)
	         + encodeURIComponent(footer)
}

/* add the opened hocr to the dom in a div with the id 'hocr' */
function addopened(e) {
	var a
	var f
	var hocr
	var start
	var end

	hocr = e.target.result

	/* cut hocr to only that inside of <body> </body> (note it's just a string) */
	start = hocr.indexOf("<body>") + "<body>".length
	end = hocr.indexOf("</body>")
	if(start == -1 || end == -1) {
		console.log("Error: failed to find body tag in hocr")
		return
	}
	hocr = hocr.substring(start, end)
	/* TODO: potentially change inner ids of hocrs as they often are identical
	 *       across different hocrs, e.g. page_1, block_1_1, etc. */

	if((a = document.getElementById("hocr")) == null) {
		f = document.getElementById("footer")
		a = document.createElement("div")
		a.id = "hocr"
		document.body.insertBefore(a, f)
	}

	a.innerHTML += hocr

	readyhocr()
}

/* read the hocr file and set up handlers for it */
function openhocr() {
	var a
	var e
	var r

	a = document.getElementById("open")
	e = document.getElementById("save")

	for(var i of a.files) {
		r = new FileReader()
		// TODO: have final onload be a closure that in addition to addopened also
		//       adds a class to hocr div so we know that it's finished loading, so
		//       future browse clicks can reset things. Probably.
		r.onload = addopened
		r.readAsText(i)
		if(e.download != "") {
			e.download = e.download.replace(".corrected.hocr", "") + "."
		}
		e.download += i.name.replace(".hocr", ".corrected.hocr")
		document.title += " - " + i.name
	}

	e.addEventListener("click", save)
}

/* try to load an image from the given image directory */
function setdir() {
	var d
	var end

	window.imgdir = ""

	d = document.getElementById("dir")

	window.imgdir = d.value
	if(window.imgdir == "") {
		end = window.location.href.lastIndexOf("/")
		window.imgdir = window.location.href.substring(0, end)
	}

	addpageimgs()
}

/* reset the canvas image above a line to its original state,
 * removing any highlighting */
function resetlineimg(line) {
	var bbox
	var c
	var ctx
	var img
	var imgs
	var imgname
	var scaledown

	// TODO: make this robust by looking for a parent node that is of type ocr_page
	imgname = titletoimgname(line.parentNode.parentNode.parentNode.title)

	imgs = document.getElementsByTagName("img")
	for(var i of imgs) {
		if(i.src.endsWith(imgname)) {
			img = i
		}
	}

	if(img == null) {
		img = imgs[0]
	}

	if(line.parentNode.getElementsByTagName("canvas").length > 0) {
		c = line.previousSibling
		scaledown = c.dataset.scaledown

		bbox = titletobbox(line.title)
		ctx = c.getContext("2d")
		ctx.drawImage(img, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width/scaledown, bbox.height/scaledown)
	}
}

/* add canvas elements above each line and draw the relevant part
 * of the page image in them */
function addlineimgs(page, img) {
	return function() {
		var c
		var ctx
		var i
		var lines
		var start
		var end
		var bbox
		var width
		var height
		var scaledown

		scaledown = img.width / 800

		lines = page.getElementsByClassName("ocr_line")
		for (i = 0; i < lines.length; i++) {
			bbox = titletobbox(lines[i].title)

			c = document.createElement("canvas")
			c.dataset.scaledown = scaledown
			c.setAttribute('width', bbox.width/scaledown)
			c.setAttribute('height', bbox.height/scaledown)
			ctx = c.getContext("2d")
			ctx.drawImage(img, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width/scaledown, bbox.height/scaledown)
			lines[i].parentNode.insertBefore(c, lines[i])
		}
	}
}

/* load all page images into the DOM and add triggers to run
 * addlineimgs() when loaded */
function addpageimgs() {
	var imgpath
	var imgname
	var pages
	var start
	var end
	var img
	var dir
	var canvases
	var i
	var p

	/* remove any old canvases, in case img dir has changed */
	canvases = document.getElementsByTagName("canvas")
	for (i = canvases.length - 1; i >= 0; i--) {
		canvases[i].parentNode.removeChild(canvases[i])
	}

	p = document.getElementById("imgpaths")
	p.textContent = ""
	p = document.getElementById("imgstatus")
	p.textContent = ""

	pages = document.getElementsByClassName("ocr_page")
	for (i = 0; i < pages.length; i++) {
		imgname = titletoimgname(pages[i].title)

		/* create a hidden img element which loads and holds the page image,
		 *    then create canvas elements to go above each .ocr_line using the bbox
		 *    data to cut it from the hidden img. */
		img = new window.Image()
		img.style = 'display:none'
		pages[i].appendChild(img)
		img.addEventListener("load", addlineimgs(pages[i], img))
		img.addEventListener("error", imgloadfailure, true)
		img.src = window.imgdir + "/" + imgname
		p = document.getElementById("imgpaths")
		if(p.textContent != "") {
			p.textContent += ", "
		}
		p.textContent += img.src
	}
}

/* write status message to #imgstatus if an image failed to load */
function imgloadfailure(event) {
	var p
	p = document.getElementById("imgstatus")
	p.textContent = "failed to load image(s)"
}

/* add click listener for each hocr word */
function readyhocr() {
	var i
	var words

	words = document.getElementsByClassName("ocrx_word")
	for (i = 0; i < words.length; i++) {
		words[i].addEventListener("click", edit)
	}

	setdir()
}
