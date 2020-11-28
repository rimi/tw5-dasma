/*\
title: $:/plugins/rimir/dasma/modules/widget/editor-generator
type: application/javascript
module-type: widget

DASMA Editor-Generator widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ModelRepo = require("$:/plugins/rimir/dasma/modules/lib/model-repo");

var GeneratorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
GeneratorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
GeneratorWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("button");
	// Add a click event handler
	domNode.addEventListener("click",function (event) {
		alert("execute generation!");
		self.generateEditorTiddlers();
		return true;
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
We don't allow actions to propagate because we trigger actions ourselves
*/
GeneratorWidget.prototype.allowActionPropagation = function() {
	return false;
};

GeneratorWidget.prototype.generateEditorTiddlers = function() {
	console.log("TODO: DO GENERATE HERE...");
};

/*
Compute the internal state of the widget
*/
GeneratorWidget.prototype.execute = function() {
	// Get attributes
	/*this.actions = this.getAttribute("actions");
	this.to = this.getAttribute("to");
	this.message = this.getAttribute("message");
	this.param = this.getAttribute("param");
	this.set = this.getAttribute("set");
	this.setTo = this.getAttribute("setTo");
	this.popup = this.getAttribute("popup");
	this.hover = this.getAttribute("hover");
	this["class"] = this.getAttribute("class","");
	this["aria-label"] = this.getAttribute("aria-label");
	this.tooltip = this.getAttribute("tooltip");
	this.style = this.getAttribute("style");
	this.selectedClass = this.getAttribute("selectedClass");
	this.defaultSetValue = this.getAttribute("default","");
	this.buttonTag = this.getAttribute("tag");
	this.dragTiddler = this.getAttribute("dragTiddler");
	this.dragFilter = this.getAttribute("dragFilter");
	this.setTitle = this.getAttribute("setTitle");
	this.setField = this.getAttribute("setField");
	this.setIndex = this.getAttribute("setIndex");
	this.popupTitle = this.getAttribute("popupTitle");
	this.tabIndex = this.getAttribute("tabindex");
	this.isDisabled = this.getAttribute("disabled","no");*/
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GeneratorWidget.prototype.refresh = function(changedTiddlers) {
	return false;
/*	var changedAttributes = this.computeAttributes();
	if(changedAttributes.actions || changedAttributes.to || changedAttributes.message || changedAttributes.param || changedAttributes.set || changedAttributes.setTo || changedAttributes.popup || changedAttributes.hover || changedAttributes["class"] || changedAttributes.selectedClass || changedAttributes.style || changedAttributes.dragFilter || changedAttributes.dragTiddler || (this.set && changedTiddlers[this.set]) || (this.popup && changedTiddlers[this.popup]) || (this.popupTitle && changedTiddlers[this.popupTitle]) || changedAttributes.setTitle || changedAttributes.setField || changedAttributes.setIndex || changedAttributes.popupTitle || changedAttributes.disabled) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);*/
};

exports["dasma-generator"] = GeneratorWidget;

})();
