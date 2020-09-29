let currentX = 0;
let currentY = 0;
let initialX = 0;
let initialY = 0;
let mouseX = 0;
let mouseY = 0;
let activeItem;
let targetItem;
let targetConnection;
let active = false;
let nodes = [];
let node = `<div class="node noselect" ontouchstart ="selectNode(this)" ontouchend="deselectNode(this)" onmouseenter="selectNode(this)" onmouseleave="deselectNode(this)">
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
            </div>`

let nodeItem = `<div class="item">
                    <div class="connection-point connection-point-item cell1" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>
                    <div class="item-text cell2">Item 1</div>
                    <div class="item-text cell3 item-delete" onclick="deleteItem(this)"><i class="fas fa-trash"></i></div>
                    <div class="connection-point connection-point-item cell4" onmousedown="createLine(this)" onmouseenter="selectConnection(this)" onmouseleave="deselectConnection(this)"></div>
                </div>`

//get the node graph and add event listeners
let nodeGraph = document.getElementById("node-graph");
if(nodeGraph){
    nodeGraph.addEventListener("touchstart", dragStart, false);
    nodeGraph.addEventListener("touchend", dragEnd, false);
    nodeGraph.addEventListener("touchmove", drag, false);

    nodeGraph.addEventListener("mousedown", dragStart, false);
    nodeGraph.addEventListener("mouseup", dragEnd, false);
    nodeGraph.addEventListener("mousemove", drag, false);
}

//expand the menus
function expand(x) {
	let buttons = document.getElementsByClassName("nav-button");
	style = "none";

	if (buttons[0].style.display === style || buttons[0].style.display === "")
		style = "block";

	for (let i = 0; i < buttons.length; i++) {
		buttons[i].style.display = style;
	}
}

//toggle the dialogue to add a node to graph
function toggleNodeDialogue(x) {
	x.parentNode.querySelector(".add-node-dialogue").classList.toggle("invisible");
}

//toggle the dialogue to add a node to graph
function hideNodeDialogue(x) {
    x.parentNode.parentNode.classList.add("invisible");
    document.getElementById("new-node-name").value = "";
}

//toggle the dialogue to add item to node
function showItemDialogue(x) {
    x.parentNode.querySelector(".add-item-dialogue").classList.remove("invisible");
    x.classList.add("invisible");
    updateLines(x.parentNode);
}

//hide the dialogue controls
function hideItemDialogue(x) {
    x.parentNode.parentNode.classList.add("invisible");
    x.parentNode.parentNode.parentNode.querySelector(".new-item").classList.remove("invisible");
    x.parentNode.parentNode.querySelector(".add-item-input").value = "";
}

//started dragging node
function dragStart(e) {
    if (!activeItem && e.target === targetItem) {
        active = true;
        activeItem = targetItem;
    
        let xOffset = activeItem['xOffset'];
        let yOffset = activeItem['yOffset'];

        if(!xOffset)
            xOffset = 0;
        if(!yOffset)
            yOffset = 0;

        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
    }
}

//stopped dragging nodes and lines
function dragEnd(e) {
    if(!activeItem || !activeItem.nodeName)
        return;

    if(activeItem.nodeName == "DIV"){
        activeItem = null;
    }else if(targetConnection){

        //prevent starting and ending line at same point
        if(targetConnection["lines-start"] && targetConnection["lines-start"].includes(activeItem))
            return;

        //connect the line to the connection point
        let offsets = targetConnection.getBoundingClientRect();
        let top = offsets.top + targetConnection.offsetHeight / 2;
        let left = offsets.left + targetConnection.offsetWidth / 2;
    
        for (let i = 0; i < activeItem.childNodes.length; i++) {
            activeItem.childNodes[i].setAttribute("x2", left);
            activeItem.childNodes[i].setAttribute("y2", top);
        }

        if(!targetConnection["lines-end"])
            targetConnection["lines-end"] = [];
        targetConnection["lines-end"].push(activeItem);

        activeItem = null;
    }else{
        activeItem.parentNode.removeChild(activeItem);
        activeItem = null;
    }
    // active = false;
    initialX = currentX;
    initialY = currentY;
}

//drag the node or line around
function drag(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

	if (active && activeItem != null) {
		e.preventDefault();

		if (e.type === "touchmove") {
			currentX = e.touches[0].clientX - initialX;
			currentY = e.touches[0].clientY - initialY;
		} else {
			currentX = e.clientX - initialX;
			currentY = e.clientY - initialY;
		}

        activeItem['xOffset'] = currentX;
        activeItem['yOffset'] = currentY;

        if(activeItem.nodeName == "DIV"){
            setPosition(currentX, currentY, activeItem);
            updateLines(activeItem);
        }else{
            setEnd(e.clientX, e.clientY, activeItem);
        }
    }
}

//update all the lines connected to the moving node
//TODO: Theres'a bug when the page size is changed. x2 & y2 are no longer accurate
function updateLines(e){
    let connectionPoints = e.querySelectorAll('.connection-point');
    loopThroughLines(connectionPoints,"lines-start", "x1", "y1");
    loopThroughLines(connectionPoints,"lines-end", "x2", "y2");
}

//loop through each connection point, svg, and line and update positions
function loopThroughLines(arr, side, x, y){

    for (let n = 0; n < arr.length; n++) {
        let svgArr = arr[n][side];
        if(!svgArr)
            continue;

        let offsets = arr[n].getBoundingClientRect();
        let top = offsets.top + arr[n].offsetHeight / 2  + nodeGraph.scrollTop;
        let left = offsets.left + arr[n].offsetWidth / 2  + nodeGraph.scrollLeft;
    
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
function setPosition(xPos, yPos, e){
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
        if(xPos && yPos){
            e.childNodes[i].setAttribute("x2", xPos);
            e.childNodes[i].setAttribute("y2", yPos);
        }
	}
}

//select node when mouse enters element
function selectNode(x){
    targetItem = x;
}

//deselect node when mouse enters element
function deselectNode(x){
    targetItem = null;
}

//select point when mouse enters element
function selectConnection(x){
    targetConnection = x;
}

//deselect point when mouse enters element
function deselectConnection(x){
    targetConnection = null;
}

//delete the node, items and all connecting lines
function deleteNode(x){
    let connectionPoints = x.parentNode.parentNode.querySelectorAll('.connection-point');
    deleteLines(connectionPoints);
    let index = nodes.indexOf(x.parentNode.parentNode);
    nodes = nodes.slice(index, 1);
    x.parentNode.parentNode.parentNode.removeChild(x.parentNode.parentNode);
}

//delete the clicked item and any lines connected to it
function deleteItem(x){

    let connectionPoints = x.parentNode.querySelectorAll('.connection-point');
    deleteLines(connectionPoints);
    let node = x.parentNode.parentNode.parentNode;
    x.parentNode.parentNode.removeChild(x.parentNode);
    if(node)
        updateLines(node);

}

//find all connecting lines and delete them
function deleteLines(arr){
    for (let n = 0; n < arr.length; n++) {
        let svgArr = arr[n]["lines-start"];
        if(!svgArr)
            svgArr = [];

        let svgArr2 = arr[n]["lines-end"];
        if(svgArr2)
            svgArr = svgArr.concat(svgArr2);

        if(svgArr.length===0)
            continue;

        for (let g = 0; g < svgArr.length; g++) {
            let svg = svgArr[g];
            svg.remove(svg); 
        }
    }
}

//create a line starting at the clicked point
function createLine(x) {

    if(activeItem != null)
        return;
        
	let offsets = x.getBoundingClientRect();
	let top = offsets.top + x.offsetHeight / 2;
	let left = offsets.left + x.offsetWidth / 2;

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
	line.setAttribute("x2", mouseX);
	line.setAttribute("y2", mouseY);
	line.setAttribute("stroke", "black");
	line.setAttribute("stroke-width", "5");

	let line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line2.setAttribute("x1", left);
	line2.setAttribute("y1", top);
	line2.setAttribute("x2", mouseX);
	line2.setAttribute("y2", mouseY);
	line2.setAttribute("stroke", "white");
	line2.setAttribute("stroke-width", "3");
    
	svg.appendChild(line);
    svg.appendChild(line2);

    active = true;
    activeItem = svg;
    
    if(!x["lines-start"])
        x["lines-start"] = [];
    x["lines-start"].push(svg);

	nodeGraph.appendChild(svg);
}

//create a new node
function createNode(x) {    
    let name = document.getElementById("new-node-name");
    
    if(name.value != ""){
        document.querySelector(".add-node-dialogue").classList.toggle("invisible");
        let newNode = document.createElement('div');
        newNode.innerHTML = node.trim();

        let n = newNode.childNodes[0];
        n.querySelector('.title-text').innerHTML = name.value;
        
        let offsets = n.getBoundingClientRect();
        n['xOffset'] = offsets.left;
        n['yOffset'] = offsets.top;
        n['name'] = name.value;
        nodes.push(n);

        name.value = "";
        nodeGraph.appendChild(n);
        newNode.remove();
    }
}

//create a new item
function createItem(x) {    
    let name = x.parentNode.parentNode.querySelector(".add-item-input");
    if(name.value != ""){
        x.parentNode.parentNode.classList.toggle("invisible");
        x.parentNode.parentNode.parentNode.querySelector(".new-item").classList.toggle("invisible");

        let item = document.createElement('div');
        item.innerHTML = nodeItem.trim();
        item.querySelector('.item-text').innerHTML = name.value;
        name.value = "";
        x.parentNode.parentNode.parentNode.querySelector('.item-list').innerHTML += item.innerHTML;
        updateLines(x.parentNode.parentNode.parentNode);
    }
}