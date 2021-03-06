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
const DEFAULT_EDITOR_TEMPLATE = "$:/plugins/rimir/dasma/generator/templates/default-editor";
	
const COMMON_EDITOR_MACROS = "$:/plugins/rimir/dasma/templates/editors/common-editor-macros";
	
const COMMON_DESCRIPTIONS_FILTER = "[tag[dasma:common-desc]]";

const PROTOTYPE_DASMA_DESCRIPTIONS = "$:/plugins/rimir/dasma/prototypes/dasma-definition";
const PROTOTYPE_GENERATOR_NAMESPACE = "$:/plugins/rimir/dasma/prototypes/state-indirection-editor";

const TIDDLER_CREATION_STATE_BASE= "$:/state/rimir/dasma/creation";
const DEFAULT_TITLE_TEMPLATE = "data/${this.editorId}/${this._now}";
	
const DEFAULT_STATETIDDLER_NAME = "$(stateTiddler)$";
const INDEX_STATETIDDLER_NAME = DEFAULT_STATETIDDLER_NAME + "/indexTiddlers/${this.fieldName}";

const FORCE_GENERATION = false;
const DEFAULT_REFERENCE_FIELD = "title";

const DEFAULT_TREE_LINK_BASE = "#:/rimir/extensions/dasma/generated";
const DEFAULT_TOC_LINKING_FIELD_NAME = "tocp.rimir.parent.ref";
const TOC_LINKING_ENABLED = true;
	
const TYPE_DESCRIPTIONS_FILTER = "[tag[dasma:desc]]";
	
const DEFAULT_OUTPUT_NAMING_BASE = "$:/rimir/extensions/dasma/generated";

const COMPONENT_CONFIGURATION = {
	"dasma/component/singleline": {
		editComponent: "dasma/edit/input",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		defaultValueRendererComponent: "dasma/value-renderers/field-asis"
	},
	"dasma/component/date": {
		editComponent: "dasma/edit/date",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		defaultValueRendererComponent: "dasma/value-renderers/field-asis"
	},
	"dasma/component/multiline": {
		editComponent: "dasma/edit/textarea",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		defaultValueRendererComponent: "dasma/value-renderers/field-asis"
	},
	"dasma/component/checkboxes": {
		useIndexStateTiddler: true,
		editComponent: "dasma/edit/checkboxes",
		saveComponent: "dasma/transfer/index2list",
		loadComponent: "dasma/transfer/list2index",
		narrowComponent: "dasma/narrower/by-caption",
		currentValueReaderComponent: "dasma/value-readers/index2list",
		defaultValueRendererComponent: "dasma/value-renderers/list-as-ul-name"
	},
	"dasma/component/multiselect": {
		editComponent: "dasma/edit/multiselect",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		narrowComponent: "dasma/narrower/by-caption",
		defaultValueRendererComponent: "dasma/value-renderers/list-as-ul-name"
	},
	"dasma/component/radio": {
		editComponent: "dasma/edit/radio",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		narrowComponent: "dasma/narrower/by-caption",
		defaultValueRendererComponent: "dasma/value-renderers/name"
	},
	"dasma/component/select": {
		editComponent: "dasma/edit/select",
		saveComponent: "dasma/transfer/field2field",
		loadComponent: "dasma/transfer/field2field",
		narrowComponent: "dasma/narrower/by-caption",
		defaultValueRendererComponent: "dasma/value-renderers/name"
	}
}

const NARROWERS = {
	"dasma/narrower/by-caption": "$:/plugins/rimir/dasma/templates/narrowers/caption-only"
}

const VALIDATORS = {
	"dasma/validators/unique-key": "$:/plugins/rimir/dasma/templates/validators/global-unique-value",
	"dasma/validators/phone": "TODO",
	"dasma/validators/e-mail": "TODO",
	"dasma/validators/url": "TODO",
	"dasma/validators/date-in-past": "TODO"
}

const VALUE_READERS = {
	"dasma/value-readers/index2list": "$:/plugins/rimir/dasma/templates/value-readers/transform-index-selected-to-list",
	"dasma/value-readers/field": "$:/plugins/rimir/dasma/templates/value-readers/read-field"
}

const DEFAULT_VALUE_READER = "dasma/value-readers/field";

const VALUE_RENDERER = {
	"dasma/value-renderers/field-asis" : "$:/plugins/rimir/dasma/templates/renderers/simple-renderer",
	"dasma/value-renderers/name" : "$:/plugins/rimir/dasma/templates/renderers/name-renderer",
	"dasma/value-renderers/list-as-ul-name" : "$:/plugins/rimir/dasma/templates/renderers/list-as-ul-name-renderer"
}

const EDITORS = {
	"dasma/edit/input": "$:/plugins/rimir/dasma/templates/widgets/edittextwidget-singlelined",
	"dasma/edit/textarea": "$:/plugins/rimir/dasma/templates/widgets/edittextwidget-mulitlined",
	"dasma/edit/checkboxes": "$:/plugins/rimir/dasma/templates/widgets/checkboxwidget",
	"dasma/edit/multiselect": "$:/plugins/rimir/dasma/templates/widgets/multi-selectwidget",
	"dasma/edit/radio": "$:/plugins/rimir/dasma/templates/widgets/radiowidget",
	"dasma/edit/select": "$:/plugins/rimir/dasma/templates/widgets/single-selectwidget",
	"dasma/edit/date": "$:/plugins/rimir/dasma/templates/widgets/editdatewidget"
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
	this.processingMessages = {
		messages: [],
		validationFailures: {}
	};
	// Add a click event handler
	domNode.addEventListener("click",function (event) {
		self.regeneratePrototype();
		self.generateCustomDefinitions();
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
	
GeneratorWidget.prototype.isForceGeneration = function() {
	return FORCE_GENERATION;
};

/*
Loads the common DASMA data (structs etc.) and returns it as Object
*/
GeneratorWidget.prototype.getPredefinedEditorComponentDescriptions = function() {
	const result = {
		fields: [],
		templates: []
	};
	$tw.utils.each($tw.wiki.filterTiddlers(COMMON_DESCRIPTIONS_FILTER),function(title) {
		const commonDescriptionTiddler = $tw.wiki.getTiddler(title);
		const commonDescription = JSON.parse(commonDescriptionTiddler.fields["text"]);
		if(commonDescription.fields){
			for (const fieldDescription of commonDescription.fields) {
				result.fields.push(fieldDescription);
			}
		}
		if(commonDescription.templates){
			for (const fieldDescription of commonDescription.templates) {
				result.templates.push(fieldDescription);
			}
		}
	});
	return result;
}

GeneratorWidget.prototype.getEditorRenderTiddlers = function() {
	return "$:/plugins/rimir/dasma/templates/editors/table-based-editor " + COMMON_EDITOR_MACROS;
}
	
GeneratorWidget.prototype.getDefaultReferenceField = function() {
	return DEFAULT_REFERENCE_FIELD;
}
	
GeneratorWidget.prototype.getBaseGeneratorOutputNamespace = function(editorDescription) {
	return (editorDescription["generator-config"] && editorDescription["generator-config"]["output-naming-base"] ? editorDescription["generator-config"]["output-naming-base"] : DEFAULT_OUTPUT_NAMING_BASE) + (editorDescription ? "/" + editorDescription.id : "");
}

GeneratorWidget.prototype.getBaseTreeLinkingPath = function(editorDescription) {
	return editorDescription["generator-config"] && editorDescription["generator-config"]["tree-link-base"] ? editorDescription["generator-config"]["tree-link-base"] : DEFAULT_TREE_LINK_BASE;
}
	
GeneratorWidget.prototype.getEditorTreeLinkingPath = function(editorDescription) {
	return this.getBaseTreeLinkingPath(editorDescription) + "/" + editorDescription.id;
}
	
GeneratorWidget.prototype.getFieldsTreeLinkingPath = function(editorDescription) {
	return this.getEditorTreeLinkingPath(editorDescription) + "/fields";
}
	
GeneratorWidget.prototype.getTreeLinkingFieldName = function(editorDescription) {
	return editorDescription["generator-config"] && editorDescription["generator-config"]["toc-field-name"] ? editorDescription["generator-config"]["toc-field-name"] : DEFAULT_TOC_LINKING_FIELD_NAME;
}

/*
BEGIN PROTOTYPE GENERATION SPECIFIC
*/
GeneratorWidget.prototype.createPrototypeFieldOverwrites = function(fieldDescription) {
	return {
		title: PROTOTYPE_GENERATOR_NAMESPACE + "/" + fieldDescription.fieldName,
		"tocp.dasma-plugin-parent.ref": "#:/p/dasma/#:/prototyping/fields",
		caption: "Prototype: " + fieldDescription.caption
	}
}

GeneratorWidget.prototype.createPrototypeEditorOverwrites = function(editorDescription) {
	return {
		title: PROTOTYPE_GENERATOR_NAMESPACE + "/editor",
		"tocp.dasma-plugin-parent.ref": "#:/p/dasma/#:/prototyping",
		caption: "Prototype-Editor",
		tags: ["dasma:editor"],
		"dasma.supported-tag": editorDescription.id
	}
}
	
/*
Regenerates the Prototype (intented to play with/enhance the current implementation)
*/
GeneratorWidget.prototype.regeneratePrototype = function() {
	var self = this;
	const generatedComponents = [];
	const commonDasmaElements = this.getPredefinedEditorComponentDescriptions();
	const prototypeStruct = JSON.parse($tw.wiki.getTiddler(PROTOTYPE_DASMA_DESCRIPTIONS).fields["text"]);
	$tw.utils.each(prototypeStruct.fields, function(fieldDescription) {
		const finalFieldDescription = self.mergeWithCommonDescription(fieldDescription, commonDasmaElements);
		generatedComponents.push(self.generateEditorComponent(finalFieldDescription, self.createPrototypeFieldOverwrites(finalFieldDescription)));
	});
	this.generateEditorEntryPoint(prototypeStruct, generatedComponents, this.createPrototypeEditorOverwrites(prototypeStruct));
}
	
/*
END PROTOTYPE GENERATION SPECIFIC
*/
	
GeneratorWidget.prototype.createCustomFieldOverwrites = function(fieldDescription, editorDescription) {
	const result = {
		title: this.getBaseGeneratorOutputNamespace(editorDescription) + "/" + fieldDescription.fieldName,
		caption: "Editor-Component: " + fieldDescription.caption
	};
	if(TOC_LINKING_ENABLED){
		result[this.getTreeLinkingFieldName(editorDescription)] = this.getFieldsTreeLinkingPath(editorDescription);
	}
	return result;
}
	
GeneratorWidget.prototype.createCustomEditorOverwrites = function(editorDescription) {
	const result = {
		title: this.getBaseGeneratorOutputNamespace(editorDescription),
		caption: "Editor: " + editorDescription.id,
		tags: ["dasma:editor"],
		"dasma.supported-tag": editorDescription.id
	};
	if(TOC_LINKING_ENABLED){
		result[this.getTreeLinkingFieldName(editorDescription)] = this.getEditorTreeLinkingPath(editorDescription);
	}
	return result;
}
	
GeneratorWidget.prototype.ensureContentTreeLinks = function(editorDescription) {
	const baseLink = this.getBaseTreeLinkingPath(editorDescription);
	const editorTreeLink = this.getEditorTreeLinkingPath(editorDescription);
	const fieldsTreeLink = this.getFieldsTreeLinkingPath(editorDescription);
	const NOW = $tw.utils.formatDateString(new Date(), "[UTC]YYYY0MM0DD0hh0mm0ss0XXX");
	if(this.isForceGeneration() || !$tw.wiki.tiddlerExists(editorTreeLink)){
		var editorLink = {
			title: editorTreeLink,
			caption: editorDescription.id,
			created: NOW,
			modified: NOW,
			bag: "default",
			type: "text/vnd.tiddlywiki"
		};
		if(TOC_LINKING_ENABLED){
			editorLink[this.getTreeLinkingFieldName(editorDescription)] = baseLink;
		}
		$tw.wiki.addTiddler(new $tw.Tiddler(editorLink));
	}
	if(this.isForceGeneration() || !$tw.wiki.tiddlerExists(fieldsTreeLink)){
		var fieldLink = {
			title: fieldsTreeLink,
			caption: "fields",
			created: NOW,
			modified: NOW,
			bag: "default",
			type: "text/vnd.tiddlywiki"
		};
		if(TOC_LINKING_ENABLED){
			fieldLink[this.getTreeLinkingFieldName(editorDescription)] = editorTreeLink;
		}
		$tw.wiki.addTiddler(new $tw.Tiddler(fieldLink));
	}
}

/*
Loads all custom structs and generates the components and the editor
*/
GeneratorWidget.prototype.generateCustomDefinitions = function() {
	var self = this;
	const predefinedEditorComponentDescriptions = this.getPredefinedEditorComponentDescriptions();

	const definitions = this.readCustomDefinitions();

	const predefinedEditorComponents = this.generatePredefinedEditorComponents(predefinedEditorComponentDescriptions);

	for(let prop in definitions){
		const generatedComponents = [];
		const dasmaStruct = definitions[prop];
		self.ensureContentTreeLinks(dasmaStruct);
		$tw.utils.each(dasmaStruct.fields, function(fieldDescription) {
			if(typeof fieldDescription === "object") {
				const finalFieldDescription = self.mergeWithCommonDescription(fieldDescription, predefinedEditorComponentDescriptions);
				generatedComponents.push(self.generateEditorComponent(finalFieldDescription, self.createCustomFieldOverwrites(finalFieldDescription, dasmaStruct)));
			}else if(typeof fieldDescription === "string"){
				//TODO check that predefined editor-component MUST exist!
				generatedComponents.push(predefinedEditorComponents[fieldDescription]);
			}else{
				//TODO gen error-message
				//Should never happen!
			}
		});
		self.generateEditorEntryPoint(dasmaStruct, generatedComponents, self.createCustomEditorOverwrites(dasmaStruct));
	}
}

GeneratorWidget.prototype.readCustomDefinitions = function() {
	const originalDescriptions = {
		"simpleAbstractDescriptions" : {},
		"derivedAbstractDescriptions" : {},
		"simpleDescriptions" : {},
		"derivedDescriptions" : {}
	};
	const result = {};
	$tw.utils.each($tw.wiki.filterTiddlers(TYPE_DESCRIPTIONS_FILTER),function(title) {
		const dasmaStructTiddler = $tw.wiki.getTiddler(title);
		const dasmaStruct = JSON.parse(dasmaStructTiddler.fields["text"]);
		if(dasmaStruct.abstract){
			if (dasmaStruct.derivesFrom) {
				originalDescriptions.derivedAbstractDescriptions[dasmaStruct.id] = dasmaStruct;
			}else{
				originalDescriptions.simpleAbstractDescriptions[dasmaStruct.id] = dasmaStruct;
			}
		} else if (dasmaStruct.derivesFrom){
			originalDescriptions.derivedDescriptions[dasmaStruct.id] = dasmaStruct;
		} else {
			originalDescriptions.simpleDescriptions[dasmaStruct.id] = dasmaStruct;
		}
	});

	for(let prop in originalDescriptions.simpleDescriptions){
		//copy over all initially existing simple descriptions
		result[prop] = originalDescriptions.simpleDescriptions[prop];
	}

	for(let prop in originalDescriptions.derivedDescriptions){
		result[prop] = this.flattenDescriptionHierarchy(originalDescriptions.derivedDescriptions[prop], originalDescriptions);
	}

	return result;
}

GeneratorWidget.prototype.flattenDescriptionHierarchy = function(description, originalDescriptions){
	let result = description;
	const derivedFromId = description.derivesFrom;
	if(derivedFromId) {
		if (originalDescriptions.simpleAbstractDescriptions[derivedFromId]) {
			result = this.mergeDescriptions(originalDescriptions.simpleAbstractDescriptions[derivedFromId], description);
		} else if (originalDescriptions.derivedAbstractDescriptions[derivedFromId]) {
			result = this.mergeDescriptions(this.flattenDescriptionHierarchy(originalDescriptions.derivedAbstractDescriptions[derivedFromId], originalDescriptions), description);
		} else if (originalDescriptions.simpleDescriptions[derivedFromId]) {
			result = this.mergeDescriptions(originalDescriptions.simpleDescriptions[derivedFromId], description);
		} else {
			result = this.mergeDescriptions(this.flattenDescriptionHierarchy(originalDescriptions.simpleDescriptions[derivedFromId], originalDescriptions), description);
		}
	}
	return result;

}

GeneratorWidget.prototype.mergeDescriptions = function(parentDesc, childDesc){
	const parentClone = JSON.parse(JSON.stringify(parentDesc));
	const childClone = JSON.parse(JSON.stringify(childDesc));
	parentClone.fields = [];
	childClone.fields = [];
	const result = deepmerge.all([parentClone, childClone]);
	result.fields = [];
	for (const fieldDescription of parentDesc.fields) {
		result.fields.push(fieldDescription);
	}
	for (const fieldDescription of childDesc.fields) {
		result.fields.push(fieldDescription);
	}
	//remove inheritance information if any
	delete result.abstract;
	delete result.derivesFrom;
	return result;
}

GeneratorWidget.prototype.mergeWithCommonDescription = function(fieldDescription, commonDasmaElements) {
	let result = fieldDescription;
	if(fieldDescription !== null) {
		if (typeof fieldDescription === "string"){

		}else if (typeof fieldDescription === "object" && fieldDescription["id.ref"]) {
			let commonFieldDescription = commonDasmaElements.fields.filter(x => x.id === fieldDescription["id.ref"])[0];
			if (!commonFieldDescription) {
				commonFieldDescription = commonDasmaElements.templates.filter(x => x.id === fieldDescription["id.ref"])[0];
			}
			commonFieldDescription ? commonFieldDescription : {};
			result = deepmerge.all([commonFieldDescription, fieldDescription]);
		}else{
			this.processingMessages.messages.push("UNKNOWN fieldDescription detected: " + JSON.stringify(fieldDescription));
		}
	}
	return result;
}
	
GeneratorWidget.prototype.generateEditorEntryPoint = function(editorDescription, editorComponentInfos, customFieldOverwrites) {
	const NOW = $tw.utils.formatDateString(new Date(), "[UTC]YYYY0MM0DD0hh0mm0ss0XXX");
	const editorTemplate = $tw.wiki.getTiddler(DEFAULT_EDITOR_TEMPLATE).fields["text"];
	const editorConfig = {
		createHeadline: (editorDescription && editorDescription.headline) ? editorDescription.headline["on-create"] : "CREATE PLACEHOLDER",
		modifyHeadline: (editorDescription && editorDescription.headline) ? editorDescription.headline["on-modify"] : "MODIFY PLACEHOLDER",
		imports: this.getEditorRenderTiddlers() + " " + this.createEditorComponentsTitlesList(editorComponentInfos),
		referenceField: this.getDefaultReferenceField(),
		creationFieldNames: this.createEditorComponentsCreationFieldNamesList(editorComponentInfos),
		modificationFieldNames: this.createEditorComponentsModificationFieldNamesList(editorComponentInfos),
		staticFieldAssignments: this.createEditorComponentsStaticFieldAssignments(editorDescription),
		newTitleTemplate: this.createTitleTemplate(editorDescription, editorComponentInfos)
	};
	const newText = formatTemplate(editorTemplate, editorConfig);
	const fields = {
		title: "DEFINEME/" + editorDescription.id,
		text: newText,
		created: NOW,
		modified: NOW,
		bag: "default",
		type: "text/vnd.tiddlywiki"
	};
	const mergedFields = deepmerge.all([fields, customFieldOverwrites]);
	if(this.isForceGeneration() || !$tw.wiki.tiddlerExists(mergedFields.title) || !$tw.wiki.checkTiddlerText(mergedFields.title, newText)){
		$tw.wiki.addTiddler(new $tw.Tiddler(mergedFields));
	}
	if(editorDescription["fs-path-tmpl"]){
		// if tiddler-files are NOT created based on its title
		const tagFields = {
			title: editorDescription.id,
			"fs-path.tmpl": editorDescription["fs-path-tmpl"],
			tags: "dasma:type"
		}
		if(this.isForceGeneration() || !$tw.wiki.tiddlerExists(tagFields.title)) {
			$tw.wiki.addTiddler(new $tw.Tiddler(tagFields));
		}
	}
}

GeneratorWidget.prototype.createTitleTemplate = function(editorDescription, editorComponentInfos) {
	const template = editorDescription["title-template"] || DEFAULT_TITLE_TEMPLATE;
	const tmplvars = {
		"_now": "<<now '[UTC]YYYY0MM0DD0hh0mm0ssXXX'>>",
		"_uid_OR_now": "<$wikify name=\"wfUid\" text=\"<<stateFieldName-uid>>\"><$list filter=\"[<stateTiddler>get<wfUid>length[]!match[0]]\" emptyMessage=\"<<now '[UTC]YYYY0MM0DD0hh0mm0ssXXX'>>\">{{{[<stateTiddler>get<wfUid>]}}}</$list></$wikify>",
		"editorId": editorDescription.id
	}
	for (var i = 0; i < editorComponentInfos.length; i++) {
		const compInfo = editorComponentInfos[i];
		tmplvars[compInfo.fieldName] = "<$wikify name=\"wfStateFieldName\" text=\"<<stateFieldName-" + compInfo.fieldName + ">>\">{{{[<stateTiddler>get<wfStateFieldName>]}}}</$wikify>";
		//TODO make all existing fields in referenced tiddlers available - not like the following static caption
		tmplvars[compInfo.fieldName+"/uid"] = "<$wikify name=\"wfStateFieldName\" text=\"<<stateFieldName-" + compInfo.fieldName + ">>\">{{{[<stateTiddler>get<wfStateFieldName>listed<referenceField>get[uid]]}}}</$wikify>";
	}
	return formatTemplate(template, tmplvars);
}

GeneratorWidget.prototype.createEditorComponentsStaticFieldAssignments = function(editorDescription) {
	let result = "";
	let first = true;
	if(!editorDescription.staticFieldAssignments){
		editorDescription.staticFieldAssignments = {};
	}
	if(editorDescription.staticFieldAssignments.tags){
		editorDescription.staticFieldAssignments.tags += " " + editorDescription.id;
	}else{
		editorDescription.staticFieldAssignments.tags = editorDescription.id;
	}
	for (var prop in editorDescription.staticFieldAssignments) {
		if(!first) result += " ";
		result += prop + "=\"" + editorDescription.staticFieldAssignments[prop] + "\"";
		first = false;
	}
	return result;
}
	
GeneratorWidget.prototype.createEditorComponentsTitlesList = function(editorComponentInfos) {
	return editorComponentInfos.map(function(elem){return elem.title;}).join(" ");
}
	
GeneratorWidget.prototype.createEditorComponentsCreationFieldNamesList = function(editorComponentInfos) {
	return editorComponentInfos.map(function(elem){return elem.showOnCreation ? elem.fieldName : "";}).join(" ");
}

GeneratorWidget.prototype.createEditorComponentsModificationFieldNamesList = function(editorComponentInfos) {
	return editorComponentInfos.map(function(elem){return elem.showOnModification ? elem.fieldName : "";}).join(" ");
}

GeneratorWidget.prototype.generatePredefinedEditorComponents = function(predefinedEditorComponentDescriptions){
	const result = {};
	const self = this;
	$tw.utils.each(predefinedEditorComponentDescriptions.fields, function(fieldDescription) {
		let componentDesc = self.generateEditorComponent(fieldDescription, self.createPredefinedFieldOverwrites(fieldDescription));
		result[fieldDescription.id] = componentDesc;
	});
	return result;
}

GeneratorWidget.prototype.createPredefinedFieldOverwrites = function(fieldDescription){
	const result = {
		title: DEFAULT_OUTPUT_NAMING_BASE + "/predefined-fields/" + fieldDescription.id,
		caption: "Editor-Component: " + fieldDescription.caption
	};
	if(TOC_LINKING_ENABLED){
		result["tocp.dasma-plugin-parent.ref"] = "#:/p/dasma/#:/generator/predef-fields";
	}
	return result;
}
	
GeneratorWidget.prototype.generateEditorComponent = function(fieldDescription, customFieldOverwrites) {
	const NOW = $tw.utils.formatDateString(new Date(), "[UTC]YYYY0MM0DD0hh0mm0ss0XXX");
	let componentConfiguration = COMPONENT_CONFIGURATION[fieldDescription.editor.component];
	
	if(fieldDescription.editor.config){
		componentConfiguration = deepmerge.all([componentConfiguration, fieldDescription.editor.config]);
	}
	
	const fieldConfig = {
		fieldName: fieldDescription.fieldName,
		caption: fieldDescription.caption,
		mandatory: fieldDescription.mandatory ? "yes" : "no",
		transient: fieldDescription.transient ? "yes" : "no",
		referenceField: fieldDescription.referenceField || this.getDefaultReferenceField(),
		currentValueReader: {
			component: componentConfiguration.currentValueReaderComponent ? VALUE_READERS[componentConfiguration.currentValueReaderComponent] : (componentConfiguration.defaultValueReaderComponent ? VALUE_READERS[componentConfiguration.defaultValueReaderComponent] : VALUE_READERS[DEFAULT_VALUE_READER])
		},
		previousValueReader: {
			component: componentConfiguration.previousValueReaderComponent ? VALUE_READERS[componentConfiguration.previousValueReaderComponent] : (componentConfiguration.defaultValueReaderComponent ? VALUE_READERS[componentConfiguration.defaultValueReaderComponent] : VALUE_READERS[DEFAULT_VALUE_READER])
		},
		narrowing: {
			display: componentConfiguration.narrowComponent ? "yes" : "no",
			component: componentConfiguration.narrowComponent ? NARROWERS[componentConfiguration.narrowComponent] : "NONE"
		},
		validation: {
			display: componentConfiguration.validationComponent ? "yes" : "no",
			component: componentConfiguration.validationComponent ? VALIDATORS[componentConfiguration.validationComponent] : "NONE"
		},
		grouping: {
			display: componentConfiguration.groupingComponent ? "yes" : "no",
			component: componentConfiguration.groupingComponent ? "TBD": "TBD"
		},
		information: {
			display: componentConfiguration.informationComponent ? "yes" : "no",
			component: componentConfiguration.informationComponent ? "TBD": "TBD"
		},
		previousValueRenderer: {
			display: fieldDescription.displayPrevious ? "yes" : "no",
			component: componentConfiguration.previousValueRendererComponent ? VALUE_RENDERER[componentConfiguration.previousValueRendererComponent]: (componentConfiguration.defaultValueRendererComponent ? VALUE_RENDERER[componentConfiguration.defaultValueRendererComponent]:"NONE")
		},
		currentValueRenderer: {
			display: fieldDescription.displayCurrent ? "yes" : "no",
			component: componentConfiguration.currentValueRendererComponent ? VALUE_RENDERER[componentConfiguration.currentValueRendererComponent]: (componentConfiguration.defaultValueRendererComponent ? VALUE_RENDERER[componentConfiguration.defaultValueRendererComponent]:"NONE")
		},
		readonlyRenderer: {
			display: fieldDescription.readonly ? "yes" : "no",
			component: componentConfiguration.readonlyRendererComponent ? VALUE_RENDERER[componentConfiguration.readonlyRendererComponent]: (componentConfiguration.defaultValueRendererComponent ? VALUE_RENDERER[componentConfiguration.defaultValueRendererComponent]:"NONE")
		},
		edit: {
			filter: this.createFilterExpression(fieldDescription.options) + (componentConfiguration.narrowComponent ? "+[subfilter<narrow-filter-" + fieldDescription.fieldName + ">]" : ""),
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
	const newText = formatTemplate(componentTemplate, fieldConfig);
	var fields = {
		title: "DEFINEME/" + fieldDescription.fieldName,
		text: newText,
		created: NOW,
		modified: NOW,
		bag: "default",
		type: "text/vnd.tiddlywiki"
	};
	const mergedFields = deepmerge.all([fields, customFieldOverwrites]);

	if(this.isForceGeneration() || !$tw.wiki.tiddlerExists(mergedFields.title) || !$tw.wiki.checkTiddlerText(mergedFields.title, newText)){
		$tw.wiki.addTiddler(new $tw.Tiddler(mergedFields));
	}
	return {
		title: mergedFields.title,
		fieldName: fieldDescription.fieldName,
		showOnCreation: true,
		showOnModification: !(fieldDescription.mandatory && fieldDescription.transient)
	};
}
	
GeneratorWidget.prototype.createFilterExpression = function(description) {
	let result = "[is[]]";
	if(description){
		result = "";
		let filterStarted = false;
		if(description.tags) {
			for (var i = 0; i < description.tags.length; i++) {
				const tag = description.tags[i];
				result += "[tag[" + tag + "]]";
			}
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
	
exports["dasma-generator"] = GeneratorWidget;

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

// DEEPMERGE (https://davidwalsh.name/javascript-deep-merge)
function isMergeableObject(val) {
    var nonNullObject = val && typeof val === 'object'

    return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]'
}

function emptyTarget(val) {
    return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
    var clone = optionsArgument && optionsArgument.clone === true
    return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
}

function defaultArrayMerge(target, source, optionsArgument) {
    var destination = target.slice()
    source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
            destination[i] = cloneIfNecessary(e, optionsArgument)
        } else if (isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, optionsArgument)
        } else if (target.indexOf(e) === -1) {
            destination.push(cloneIfNecessary(e, optionsArgument))
        }
    })
    return destination
}

function mergeObject(target, source, optionsArgument) {
    var destination = {}
    if (isMergeableObject(target)) {
        Object.keys(target).forEach(function (key) {
            destination[key] = cloneIfNecessary(target[key], optionsArgument)
        })
    }
    Object.keys(source).forEach(function (key) {
        if (!isMergeableObject(source[key]) || !target[key]) {
            destination[key] = cloneIfNecessary(source[key], optionsArgument)
        } else {
            destination[key] = deepmerge(target[key], source[key], optionsArgument)
        }
    })
    return destination
}

function deepmerge(target, source, optionsArgument) {
    var array = Array.isArray(source);
    var options = optionsArgument || { arrayMerge: defaultArrayMerge }
    var arrayMerge = options.arrayMerge || defaultArrayMerge

    if (array) {
        return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
    } else {
        return mergeObject(target, source, optionsArgument)
    }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
    if (!Array.isArray(array) || array.length < 2) {
        throw new Error('first argument should be an array with at least two elements')
    }

    // we are sure there are at least 2 values, so it is safe to have no initial value
    return array.reduce(function(prev, next) {
        return deepmerge(prev, next, optionsArgument)
    })
}

// /DEEPMERGE

})();
