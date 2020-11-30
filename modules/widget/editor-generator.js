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

const DEFAULT_COMPONENT_TEMPLATE = "$:/plugins/rimir/dasma/generator/templates/default-component";
const COMMON_DASMA_DESCRIPTIONS = "$:/plugins/rimir/dasma/generator/common-dasma-elements";
	
const DEFAULT_STATETIDDLER_NAME = "$(stateTiddler)$";
const INDEX_STATETIDDLER_NAME = DEFAULT_STATETIDDLER_NAME + "/indexTiddlers/$(stateFieldName-${this.fieldName})$";

const COMPONENT_CONFIGURATION = {
	"dasma/component/singleline": {
		editComponent: "dasma/edit/input",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
	},
	"dasma/component/multiline": {
		editComponent: "dasma/edit/textarea",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
	},
	"dasma/component/checkboxes": {
		useIndexStateTiddler: true,
		editComponent: "dasma/edit/checkboxes",
		saveComponent: "dasma/transfer/index2list",
		loadComponent: "dasma/transfer/list2index",
		narrowComponent: "dasma/narrower/by-caption"
	},
	"dasma/component/multiselect": {
		editComponent: "dasma/edit/multiselect",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		narrowComponent: "dasma/narrower/by-caption"
	},
	"dasma/component/radio": {
		editComponent: "dasma/edit/radio",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		narrowComponent: "dasma/narrower/by-caption"
	},
	"dasma/component/select": {
		editComponent: "dasma/edit/select",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		narrowComponent: "dasma/narrower/by-caption"
	}
}

const NARROWERS = {
	"dasma/narrower/by-caption": "$:/plugins/rimir/dasma/templates/narrowers/caption-only"
}

const VALIDATORS = {
	"tbd": "TBD"
}

const EDITORS = {
	"dasma/edit/input": "$:/plugins/rimir/dasma/templates/widgets/edittextwidget-singlelined",
	"dasma/edit/textarea": "$:/plugins/rimir/dasma/templates/widgets/edittextwidget-mulitlined",
	"dasma/edit/checkboxes": "$:/plugins/rimir/dasma/templates/widgets/multi-selectwidget",
	"dasma/edit/multiselect": "$:/plugins/rimir/dasma/templates/widgets/multi-selectwidget",
	"dasma/edit/radio": "$:/plugins/rimir/dasma/templates/widgets/radiowidget",
	"dasma/edit/select": "$:/plugins/rimir/dasma/templates/widgets/single-selectwidget"
}

const TRANSFERERS = {
	"dasma/transfer/field2field": "$:/plugins/rimir/dasma/templates/actions/copy-field-to-field",
	"dasma/transfer/list2index": "$:/plugins/rimir/dasma/templates/actions/transfer-list-field-to-indexes",
	"dasma/transfer/index2list": "$:/plugins/rimir/dasma/templates/actions/transfer-indexes-to-list-field"
}

	
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
		self.generateCommonEditorTiddlers();
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

GeneratorWidget.prototype.generateCommonEditorTiddlers = function() {
	var self = this;
	const NOW = $tw.utils.formatDateString(new Date(), "[UTC]YYYY0MM0DD0hh0mm0ss0XXX");
	const commonDasmaElementsJSON = $tw.wiki.getTiddler(COMMON_DASMA_DESCRIPTIONS).fields["text"];
	const commonDasmaElements = JSON.parse(commonDasmaElementsJSON);
	console.log(commonDasmaElements);
	commonDasmaElements.fields.forEach(function (fieldDescription, index) {
		const componentConfiguration = COMPONENT_CONFIGURATION[fieldDescription.editor.component];
		const fieldConfig = {
			fieldName: fieldDescription.fieldName,
			caption: fieldDescription.caption,
			narrowing: {
				display: componentConfiguration.narrowComponent ? "yes" : "no",
				component: componentConfiguration.narrowComponent ? NARROWERS[componentConfiguration.narrowComponent] : "NONE"
			},
			validation: {
				display: componentConfiguration.validationComponent ? "yes" : "no",
				component: componentConfiguration.validationComponent ? "TBD": "TBD"
			},
			grouping: {
				display: componentConfiguration.groupingComponent ? "yes" : "no",
				component: componentConfiguration.groupingComponent ? "TBD": "TBD"
			},
			information: {
				display: componentConfiguration.informationComponent ? "yes" : "no",
				component: componentConfiguration.informationComponent ? "TBD": "TBD"
			},
			previousValue: {
				display: componentConfiguration.previousValueComponent ? "yes" : "no",
				component: componentConfiguration.previousValueComponent ? "TBD": "TBD"
			},
			currentValue: {
				display: componentConfiguration.currentValueComponent ? "yes" : "no",
				component: componentConfiguration.currentValueComponent ? "TBD": "TBD"
			},
			edit: {
				filter: self.createFilterExpression(fieldDescription.options) + (componentConfiguration.narrowComponent ? "+[subfilter<narrow-filter-" + fieldDescription.fieldName + ">]" : ""),
				component: componentConfiguration.editComponent ? EDITORS[componentConfiguration.editComponent]: "NONE",
				customFields: "rimir:dasma:custom:numOfVisibleElements='3'"
			},
			save: {
				component: componentConfiguration.saveComponent ? TRANSFERERS[componentConfiguration.saveComponent]: "NONE",
				customFields: "rimir:dasma:custom:numOfVisibleElements='3'"
			},
			load: {
				component: componentConfiguration.loadComponent ? TRANSFERERS[componentConfiguration.loadComponent]: "NONE",
				customFields: "rimir:dasma:custom:numOfVisibleElements='3'"
			}
			
		};
		let stateTiddlerName = componentConfiguration.useIndexStateTiddler ? formatTemplate(INDEX_STATETIDDLER_NAME, fieldConfig) : DEFAULT_STATETIDDLER_NAME;
		fieldConfig.stateTiddlerName = stateTiddlerName;
		const componentTemplate = $tw.wiki.getTiddler(DEFAULT_COMPONENT_TEMPLATE).fields["text"];
//		console.log(fieldDescription);
		var fields = {
			title: fieldDescription.id,
			text: formatTemplate(componentTemplate, fieldConfig),
			created: NOW,
			modified: NOW,
			bag: "default",
			type: "text/vnd.tiddlywiki"
		};
//		console.log(fields);
		$tw.wiki.addTiddler(new $tw.Tiddler(fields));
	});
};
	
GeneratorWidget.prototype.createFilterExpression = function(description) {
	let result = "[is[]]";
	if(description){
		result = "";
		let filterStarted = false;
		if(description.tags) {
			result += "[";
			for (var i = 0; i < description.tags.length; i++) {
				const tag = description.tags[i];
				result += "[tag[" + tag + "]]";
			}
			result += "]";
			filterStarted = true;
		}
		if(description.filter){
			if(filterStarted) result += "+";
			result += "[" + description.filter + "]";
			filterStarted = true;
		}
	}
	return result;
}

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

// UTILS BEGIN

const formatString = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
  });
};
    
const formatTemplate = function(templateString, templateVars){
  return new Function("return `"+templateString +"`;").call(templateVars);
}

exports["dasma-generator"] = GeneratorWidget;

})();
