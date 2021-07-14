var currentPos = { x: 0, y: 0 };
var initialPos = { x: 0, y: 0 };
var mousePos = { x: 0, y: 0 };
var activeItem;
var targetItem;
var targetConnection;
var active = false;
var nodes = [];
const NODE = `<div class="node noselect" ontouchstart ="selectNode(this)" ontouchend="deselectNode(this)" onmouseenter="selectNode(this)" onmouseleave="deselectNode(this)">
                <div class="connection-point connection-point-node" ontouchstart ="selectConnection(this)" ontouchend="deselectConnection(this)" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>
                <div class="title">
                    <h4 class="title-text cell1">Title</h4>
                    <div class="cell2 node-delete" onclick="deleteNode(this)"><i class="fas fa-trash"></i></div>
                </div>
                <div class="item-list"></div>
                <div class="add-item-dialogue invisible">
                    <input class="add-item-input" type="text" placeholder="Enter item..." required>
                    <div>      
                    <button name="add-item-btn" onclick="createItem(this)">Add Item</button>
                    <button onclick="hideItemDialogue(this)">X</button>
                    </div>
                </div>
                <div class="new-item noselect" onclick="showItemDialogue(this)">
                    <div class="add-item cell1">+</div>
                    <div class="item-text cell2">Add New Item</div>
                </div>
                <div class="connection-point connection-point-node" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>
            </div>`;

const NODE_ITEM = `<div class="item">
                    <div class="connection-point connection-point-item cell1" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>
                    <div class="item-text cell2">Item 1</div>
                    <div class="item-text cell3 item-delete" onclick="deleteItem(this)"><i class="fas fa-trash"></i></div>
                    <div class="connection-point connection-point-item cell4" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>
                </div>`;

//get the node graph and add event listeners
let nodeGraph = document.getElementById("node-graph");
if (nodeGraph) {
	nodeGraph.addEventListener("touchstart", dragStart, false);
	nodeGraph.addEventListener("touchend", dragEnd, false);
	nodeGraph.addEventListener("touchmove", drag, false);

	nodeGraph.addEventListener("mousedown", dragStart, false);
	nodeGraph.addEventListener("mouseup", dragEnd, false);
	nodeGraph.addEventListener("mousemove", drag, false);
	nodeGraph.addEventListener("contextmenu", (e) => {
		findLineIntersect(nodeGraph, e);
		e.preventDefault();
	});
}

//expand the menus
function expand(ele) {
	let buttons = document.getElementsByClassName("nav-button");
	style = "none";

	if (buttons[0].style.display === style || buttons[0].style.display === "")
		style = "block";

	for (let i = 0; i < buttons.length; i++) {
		buttons[i].style.display = style;
	}
}

//toggle the dialogue to add a node to graph
function toggleNodeDialogue(ele) {
	ele.parentNode
		.querySelector(".add-node-dialogue")
		.classList.toggle("invisible");
}

//toggle the dialogue to add a node to graph
function hideNodeDialogue(ele) {
	ele.parentNode.parentNode.classList.add("invisible");
	document.getElementById("new-node-name").value = "";
}

//toggle the dialogue to add item to node
function showItemDialogue(ele) {
	ele.parentNode
		.querySelector(".add-item-dialogue")
		.classList.remove("invisible");
	ele.classList.add("invisible");
	updateLines(ele.parentNode);
}

//hide the dialogue controls
function hideItemDialogue(ele) {
	ele.parentNode.parentNode.classList.add("invisible");
	ele.parentNode.parentNode.parentNode
		.querySelector(".new-item")
		.classList.remove("invisible");
	ele.parentNode.parentNode.querySelector(".add-item-input").value = "";
}

//started dragging node
function dragStart(e) {
	if (!activeItem && e.target === targetItem) {
		active = true;
		activeItem = targetItem;

		var style = window.getComputedStyle(activeItem);
		var matrix = new WebKitCSSMatrix(style.transform);

		if (e.type === "touchstart") {
			initialPos = {
				x: e.touches[0].clientX - matrix.m41,
				y: e.touches[0].clientY - matrix.m42,
			};
		} else {
			initialPos = {
				x: e.clientX - matrix.m41,
				y: e.clientY - matrix.m42,
			};
		}
	}
}

//stopped dragging nodes and lines
function dragEnd(e) {
	if (!activeItem || !activeItem.nodeName) return;

	if (activeItem.nodeName == "DIV") {
		activeItem = null;
	} else if (targetConnection) {
		//prevent starting and ending line at same point
		if (
			targetConnection["lines-start"] &&
			targetConnection["lines-start"].includes(activeItem)
		)
			return;

		//connect the line to the connection point
		let offsets = targetConnection.getBoundingClientRect();
		let top = offsets.top + targetConnection.offsetHeight / 2;
		let left = offsets.left + targetConnection.offsetWidth / 2;

		for (let i = 0; i < activeItem.childNodes.length; i++) {
			activeItem.childNodes[i].setAttribute("x2", left);
			activeItem.childNodes[i].setAttribute("y2", top);
		}

		if (!targetConnection["lines-end"]) targetConnection["lines-end"] = [];
		targetConnection["lines-end"].push(activeItem);
		activeItem["nodes"].push(targetConnection);

		activeItem = null;
	} else {
		activeItem.parentNode.removeChild(activeItem);
		activeItem = null;
	}
}

//drag the node or line around
function drag(e) {
	mousePos = { x: e.clientX, y: e.clientY };

	if (active && activeItem != null) {
		e.preventDefault();

		if (e.type === "touchmove") {
			currentPos = {
				x: e.touches[0].clientX - initialPos.x,
				y: e.touches[0].clientY - initialPos.y,
			};
		} else {
			currentPos = {
				x: e.clientX - initialPos.x,
				y: e.clientY - initialPos.y,
			};
		}

		if (activeItem.nodeName == "DIV") {
			setPosition(currentPos.x, currentPos.y, activeItem);
			updateLines(activeItem);
		} else {
			setEnd(e.clientX, e.clientY, activeItem);
		}
	}
}

//update all the lines connected to the moving node
function updateLines(e) {
	let connectionPoints = e.querySelectorAll(".connection-point");
	loopThroughLines(connectionPoints, "lines-start", "x1", "y1");
	loopThroughLines(connectionPoints, "lines-end", "x2", "y2");
}

//loop through each connection point, svg, and line and update positions
function loopThroughLines(arr, side, x, y) {
	for (let n = 0; n < arr.length; n++) {
		let svgArr = arr[n][side];
		if (!svgArr) continue;

		let offsets = arr[n].getBoundingClientRect();
		let top = offsets.top + arr[n].offsetHeight / 2 + nodeGraph.scrollTop;
		let left = offsets.left + arr[n].offsetWidth / 2 + nodeGraph.scrollLeft;

		//update the line ending points
		for (let g = 0; g < svgArr.length; g++) {
			let svg = svgArr[g];

			for (let i = 0; i < svg.childNodes.length; i++) {
				svg.childNodes[i].setAttribute(x, left);
				svg.childNodes[i].setAttribute(y, top);
			}
		}
	}
}

//move node
function setPosition(xPos, yPos, e) {
	e.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
}

//move line start position
function setStart(xPos, yPos, e) {
	for (let i = 0; i < e.childNodes.length; i++) {
		e.childNodes[i].setAttribute("x", xPos);
		e.childNodes[i].setAttribute("y", yPos);
	}
}

//move line end position
function setEnd(xPos, yPos, e) {
	for (let i = 0; i < e.childNodes.length; i++) {
		if (xPos && yPos) {
			e.childNodes[i].setAttribute("x2", xPos);
			e.childNodes[i].setAttribute("y2", yPos);
		}
	}
}

//select node when mouse enters element
function selectNode(ele) {
	targetItem = ele;
}

//deselect node when mouse enters element
function deselectNode(ele) {
	targetItem = null;
}

//select point when mouse enters element
function selectConnection(ele) {
	targetConnection = ele;
}

//deselect point when mouse enters element
function deselectConnection(ele) {
	targetConnection = null;
}

//delete the node, items and all connecting lines
function deleteNode(ele) {
	let connectionPoints =
		ele.parentNode.parentNode.querySelectorAll(".connection-point");
	deleteLines(connectionPoints);
	let index = nodes.indexOf(ele.parentNode.parentNode);
	nodes = nodes.slice(index, 1);
	ele.parentNode.parentNode.parentNode.removeChild(ele.parentNode.parentNode);
}

//delete the clicked item and any lines connected to it
function deleteItem(ele) {
	let connectionPoints = ele.parentNode.querySelectorAll(".connection-point");
	deleteLines(connectionPoints);
	let node = ele.parentNode.parentNode.parentNode;
	ele.parentNode.parentNode.removeChild(ele.parentNode);
	if (node) updateLines(node);
}

//Delete specific line from connected nodes
function deleteLine(element) {
	let nodes = element["nodes"];

	for (let n = 0; n < nodes.length; n++) {
		//remove lines from arrays
		if (
			nodes[n]["lines-start"] != undefined &&
			nodes[n]["lines-start"].indexOf(element) != -1
		) {
			let index = nodes[n]["lines-start"].indexOf(element);
			nodes[n]["lines-start"].splice(index, 1);
		}

		if (
			nodes[n]["lines-end"] != undefined &&
			nodes[n]["lines-end"].indexOf(element) != -1
		) {
			let index = nodes[n]["lines-end"].indexOf(element);
			nodes[n]["lines-end"].splice(index, 1);
		}
	}
	element.parentNode.removeChild(element);
}

//find all connecting lines and delete them
function deleteLines(arr) {
	for (let n = 0; n < arr.length; n++) {
		let svgArr = arr[n]["lines-start"];
		if (!svgArr) svgArr = [];

		let svgArr2 = arr[n]["lines-end"];
		if (svgArr2) svgArr = svgArr.concat(svgArr2);

		if (svgArr.length === 0) continue;

		for (let g = 0; g < svgArr.length; g++) {
			let svg = svgArr[g];
			svg.remove(svg);
		}
	}
}

//find if and where the mouse intersects with a line, overrides contextmenu action
function findLineIntersect(graph, event) {
	let svg = graph.querySelectorAll(".lines");
	serializeNodes(graph);
	if (svg.length > 0) {
		svg.forEach((lineContainer) => {
			let localMousePos = getCursorPosition(graph, event);
			let line = lineContainer.firstChild;

			let x1 = line.getAttribute("x1");
			let y1 = line.getAttribute("y1");
			let x2 = line.getAttribute("x2");
			let y2 = line.getAttribute("y2");

			let distAC = Math.sqrt(
				Math.pow(x1 - localMousePos.x, 2) +
					Math.pow(y1 - localMousePos.y, 2)
			);
			let distCB = Math.sqrt(
				Math.pow(localMousePos.x - x2, 2) +
					Math.pow(localMousePos.y - y2, 2)
			);
			let distAB = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

			//if point is on the line +/- 1, then delete it
			if (Math.abs(distAC + distCB - distAB) < 1) {
				deleteLine(lineContainer);
			}
		});
	}
}

//serialize node data
function serializeNodes(graph) {
	//console.log(graph.innerHTML);
	// graph.innerHTML =
	// '<div class="node noselect" ontouchstart="selectNode(this)" ontouchend="deselectNode(this)" onmouseenter="selectNode(this)" onmouseleave="deselectNode(this)" style="transform: translate3d(551px, 169px, 0px);">\n                <div class="connection-point connection-point-node" ontouchstart="selectConnection(this)" ontouchend="deselectConnection(this)" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n                <div class="title">\n                    <h4 class="title-text cell1">sad</h4>\n                    <div class="cell2 node-delete" onclick="deleteNode(this)"><i class="fas fa-trash"></i></div>\n                </div>\n                <div class="item-list"><div class="item">\n                    <div class="connection-point connection-point-item cell1" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n                    <div class="item-text cell2">asdsd</div>\n                    <div class="item-text cell3 item-delete" onclick="deleteItem(this)"><i class="fas fa-trash"></i></div>\n                    <div class="connection-point connection-point-item cell4" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n                </div></div>\n                <div class="add-item-dialogue invisible">\n                    <input class="add-item-input" type="text" placeholder="Enter item..." required="">\n                    <div>      \n                    <button name="add-item-btn" onclick="createItem(this)">Add Item</button>\n                    <button onclick="hideItemDialogue(this)">X</button>\n                    </div>\n                </div>\n                <div class="new-item noselect" onclick="showItemDialogue(this)">\n                    <div class="add-item cell1">+</div>\n                    <div class="item-text cell2">Add New Item</div>\n                </div>\n                <div class="connection-point connection-point-node" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n            </div>';
}

//serialize node data
function deSerializeNodes(graph) {
	//graph.innerHTML =
	//	'<div class="node noselect" ontouchstart="selectNode(this)" ontouchend="deselectNode(this)" onmouseenter="selectNode(this)" onmouseleave="deselectNode(this)" style="transform: translate3d(551px, 169px, 0px);">\n                <div class="connection-point connection-point-node" ontouchstart="selectConnection(this)" ontouchend="deselectConnection(this)" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n                <div class="title">\n                    <h4 class="title-text cell1">sad</h4>\n                    <div class="cell2 node-delete" onclick="deleteNode(this)"><i class="fas fa-trash"></i></div>\n                </div>\n                <div class="item-list"><div class="item">\n                    <div class="connection-point connection-point-item cell1" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n                    <div class="item-text cell2">asdsd</div>\n                    <div class="item-text cell3 item-delete" onclick="deleteItem(this)"><i class="fas fa-trash"></i></div>\n                    <div class="connection-point connection-point-item cell4" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n                </div></div>\n                <div class="add-item-dialogue invisible">\n                    <input class="add-item-input" type="text" placeholder="Enter item..." required="">\n                    <div>      \n                    <button name="add-item-btn" onclick="createItem(this)">Add Item</button>\n                    <button onclick="hideItemDialogue(this)">X</button>\n                    </div>\n                </div>\n                <div class="new-item noselect" onclick="showItemDialogue(this)">\n                    <div class="add-item cell1">+</div>\n                    <div class="item-text cell2">Add New Item</div>\n                </div>\n                <div class="connection-point connection-point-node" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>\n            </div>';
}

//returns the coordinates of the mouse
function getCursorPosition(element, event) {
	const rect = element.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	return { x, y };
}

//create a line starting at the clicked point
function createLine(ele) {
	if (activeItem != null) return;

	let offsets = ele.getBoundingClientRect();
	let top = offsets.top + ele.offsetHeight / 2;
	let left = offsets.left + ele.offsetWidth / 2;

	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.style.position = "absolute";
	svg.setAttribute("width", "100%");
	svg.setAttribute("height", "100%");
	svg.setAttribute("position", "absolute");
	svg.setAttribute("pointer-events", "none");
	svg.classList.add("lines");

	let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line.setAttribute("x1", left);
	line.setAttribute("y1", top);
	line.setAttribute("x2", mousePos.x);
	line.setAttribute("y2", mousePos.y);
	line.setAttribute("stroke", "black");
	line.setAttribute("stroke-width", "5");

	let line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line2.setAttribute("x1", left);
	line2.setAttribute("y1", top);
	line2.setAttribute("x2", mousePos.x);
	line2.setAttribute("y2", mousePos.y);
	line2.setAttribute("stroke", "white");
	line2.setAttribute("stroke-width", "3");

	svg.appendChild(line);
	svg.appendChild(line2);

	active = true;
	activeItem = svg;

	if (!ele["lines-start"]) ele["lines-start"] = [];
	ele["lines-start"].push(svg);
	if (!svg["nodes"]) svg["nodes"] = [];
	svg["nodes"].push(ele);

	nodeGraph.appendChild(svg);
}

//create a new node
function createNode(ele) {
	let name = document.getElementById("new-node-name");

	if (name.value != "") {
		document
			.querySelector(".add-node-dialogue")
			.classList.toggle("invisible");
		let newNode = document.createElement("div");
		newNode.innerHTML = NODE.trim();

		let n = newNode.childNodes[0];
		n.querySelector(".title-text").innerHTML = name.value;

		n["name"] = name.value;
		nodes.push(n);

		//TODO:check if it's overlapping and offset by a few units if it
		setPosition(100, 100, n);

		name.value = "";
		nodeGraph.appendChild(n);
		newNode.remove();
	}
}

//create a new item
function createItem(ele) {
	let name = ele.parentNode.parentNode.querySelector(".add-item-input");
	if (name.value != "") {
		ele.parentNode.parentNode.classList.toggle("invisible");
		ele.parentNode.parentNode.parentNode
			.querySelector(".new-item")
			.classList.toggle("invisible");

		let item = document.createElement("div");
		item.innerHTML = NODE_ITEM.trim();
		item.querySelector(".item-text").innerHTML = name.value;
		name.value = "";
		ele.parentNode.parentNode.parentNode.querySelector(
			".item-list"
		).innerHTML += item.innerHTML;
		updateLines(ele.parentNode.parentNode.parentNode);
	}
}
