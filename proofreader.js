'use strict'

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

/* key handler for character edit box */
function charkeys(event) {
	/* WebKit uses deprecated keyCode, which has different semantics to key,
	 * unfortunately. Support both for now */

	if(event.key && event.key == "ArrowRight" ||
	   event.keyCode && event.keyCode == 39) {
		next(this)
	}

	if(event.key && event.key == "ArrowLeft" ||
	   event.keyCode && event.keyCode == 37) {
		prev(this)
	}

	if(event.key && event.key == "ArrowDown" ||
	   event.keyCode && event.keyCode == 40) {
		down(this)
	}

	if(event.key && event.key == "ArrowUp" ||
	   event.keyCode && event.keyCode == 38) {
		up(this)
	}
}

/* open input box for the next character and close input box for current character */
function next(c) {
	var e
	var p

	if((p = c.parentNode.nextSibling.nextSibling) == null) {
		return
	}

	/* dispatch 'click' event to open the next input box */
	e = new Event("click")
	p.dispatchEvent(e)

	/* dispatch 'input' event to close the current input box */
	e = new Event("input")
	c.dispatchEvent(e)
}

/* open input box for the previous character and close input box for current character */
function prev(c) {
	var e
	var p

	/* dispatch 'click' event to open the next input box */
	if((p = c.parentNode.previousSibling.previousSibling) != null) {
		e = new Event("click")
		p.dispatchEvent(e)
	}

	/* dispatch 'input' event to close the current input box */
	e = new Event("input")
	c.dispatchEvent(e)
}

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


/* remove the input box and update the character */
function stopedit() {
	var p

	/* may be null if this has already been updated (e.g. if it's called more than once) */
	if((p = this.parentNode) == null) {
		return
	}
	p.innerHTML = this.value

	p.addEventListener("click", edit)
}

/* ensure the whole character box is highlighted */
function selectall(event) {
	var a

	/* only do this if event was from an arrow key, as otherwise
	 * we'll get in the way of editing */
	if(event.key &&
	   (event.key != "ArrowLeft") &&
	   (event.key != "ArrowRight") &&
	   (event.key != "ArrowUp") &&
	   (event.key != "ArrowDown")) {
		return
	}
	if(event.keyCode &&
	   (event.keyCode != 37) &&
	   (event.keyCode != 38) &&
	   (event.keyCode != 39) &&
	   (event.keyCode != 40)) {
		return
	}

	a = document.getElementsByClassName("editchar")

	if(a.length == 1) {
		a[0].selectionStart = 0
		a[0].selectionEnd = a[0].value.length
	}

	a[0].style.width = (a[0].value.length * 0.8) + "em"
}

/* replace the character with an input box with the character */
function edit() {
	var input
	var a

	input = document.createElement("input")
	input.className = "editchar"
	input.size = 1
	input.value = this.innerHTML.replace("&amp;", "&")

	input.addEventListener("input", edited)
	input.addEventListener("blur", stopedit)
	input.addEventListener("keydown", charkeys)
	input.addEventListener("keyup", selectall)

	this.removeEventListener("click", edit)

	this.innerHTML = ""
	this.appendChild(input)
	input.focus()
	input.selectionStart = 0
	input.selectionEnd = input.value.length
	input.style.width = (input.value.length * 0.8) + "em"
}

function save() {
	var hocr
	var e

	e = document.getElementById("save")
	hocr = document.getElementById("hocr").innerHTML

	/* strip canvas tags that were inserted by proofreader */
	hocr = hocr.replaceAll(/<canvas.*\/canvas>/g, "")

	/* replace &quot; with ' (there may be other cases where such replacements
	 * are necessary, or a better place to do this) */
	hocr = hocr.replaceAll(/&quot;/g, "'")

	e.href = "data:application/octet;charset=utf-8," + encodeURIComponent(hocr)
}

function addopened(e) {
	var a
	var f
	var hocr
	var start
	var end

	if((hocr = document.getElementById("hocr")) != null) {
		hocr.parentNode.removeChild(hocr)
	}

	hocr = e.target.result

	/* cut hocr to only that inside of <body> </body> (note it's just a string) */
	start = hocr.indexOf("<body>") + "<body>".length
	end = hocr.indexOf("</body>")
	if(start == -1 || end == -1) {
		console.log("Error: failed to find body tag in hocr")
		return
	}
	hocr = hocr.substring(start, end)

	f = document.getElementById("footer")

	a = document.createElement("div")
	a.id = "hocr"
	a.innerHTML = hocr
	document.body.insertBefore(a, f)

	readyhocr()
}

function openhocr() {
	var a
	var e
	var r

	a = document.getElementById("open")

	r = new FileReader()
	r.onload = addopened
	r.readAsText(a.files[0])

	e = document.getElementById("save")
	e.download = a.files[0].name.replace(".hocr", ".corrected.hocr")
	document.title = a.files[0].name + " - HOCR Proofreader"

	e.addEventListener("click", save)
}

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
		const bbfield = {
			"x1": 1,
			"y1": 2,
			"x2": 3,
			"y2": 4,
		}

		scaledown = img.width / 800

		lines = page.getElementsByClassName("ocr_line")
		for (i = 0; i < lines.length; i++) {
			start = lines[i].title.indexOf("bbox")
			end = lines[i].title.indexOf(";")
			bbox = lines[i].title.substring(start, end).split(" ")
			width = bbox[bbfield.x2] - bbox[bbfield.x1]
			height = bbox[bbfield.y2] - bbox[bbfield.y1]

			c = document.createElement("canvas")
			c.setAttribute('width', width/scaledown)
			c.setAttribute('height', height/scaledown)
			ctx = c.getContext("2d")
			ctx.drawImage(img, bbox[bbfield.x1], bbox[bbfield.y1], width, height, 0, 0, width/scaledown, height/scaledown)
			lines[i].parentNode.insertBefore(c, lines[i])
		}
	}
}

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
		start = pages[i].title.indexOf('image "') + 'image "'.length
		end = pages[i].title.indexOf('"; bbox')
		imgpath = pages[i].title.substring(start, end)

		start = imgpath.lastIndexOf("/") + "/".length
		imgname = imgpath.substring(start)

		/* create a hidden img element which loads and holds the page image,
		 *    then create canvas elements to go above each .ocr_line using the bbox
		 *    data to cut it from the hidden img. */
		img = new Image()
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

function imgloadfailure(event) {
	var p
	p = document.getElementById("imgstatus")
	p.textContent = "failed to load image(s)"
}

/* add click listener for each hocr character */
function readyhocr() {
	var i
	var chars

	chars = document.getElementsByClassName("ocrx_word")
	for (i = 0; i < chars.length; i++) {
		chars[i].addEventListener("click", edit)
	}

	setdir()
}
