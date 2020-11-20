/*
The Legacy-Editor for DASMA-Controlled Tiddlers.
*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
	
var ModelRepo = require("$:/plugins/rimir/dasma/modules/lib/model-repo");
	
const DEFAULT_EDITOR_TEMPLATE = "$:/plugins/rimir/data-type-description/templates/default-editor";

var RenderWidget = function(parseTreeNode,options) {
	this.logger = new $tw.utils.Logger("rimir:dtd-editor-widget", {enable: false});
	
	this.logger.log("Calling CONSTRUCTOR");
	this.initialise(parseTreeNode,options);
	this.computeAttributes();
	
	// Get our attributes
	let modelKey = this.getAttribute("modelByTypeTag");
	if(!modelKey){
		modelKey = this.getAttribute("model");
	}
	this.model = ModelRepo.getModel(modelKey);
	this.popupState = this.getAttribute("popupState");
	this.additionalTags = this.getAttribute("additionalTags");
	this.targetTiddlerTitle = this.getAttribute("targetTiddler");
	this.stateTiddlerTitle = this.getAttribute("stateTiddler");
	
	
};

/*
Inherit from the base widget class
*/
RenderWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RenderWidget.prototype.render = function(parent,nextSibling) {
	
	this.logger.log("RenderWidget: Calling render()");
	
	this.parentDomNode = parent;
	this.execute();
	
	// Render the children
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
RenderWidget.prototype.execute = function() {
	this.logger.log("Calling execute()");
	
	let model = this.model;
	if(!this.targetTiddlerTitle){
		this.targetTiddlerTitle = formatTemplate(model.title.template, {now: $tw.utils.formatDateString(new Date(), "[UTC]YYYY0MM0DD0hh0mm0ss0XXX")});
	}
	this.logger.log("Target-Tiddler will be: '" + this.targetTiddlerTitle + "'");
	
	if(!this.stateTiddlerTitle){
		this.stateTiddlerTitle = "$:/state/rimir/json-data-desc/" + this.targetTiddlerTitle;
	}
	this.logger.log("Using state-tiddler '" + this.stateTiddlerTitle + "' to intermediately collect data");
	
	this.existingTargetTiddler = this.wiki.getTiddler(this.targetTiddlerTitle);
	
	const stateFieldPrefix = "tmp_";
	const dynamicTagFieldPrefix = "tag_";
	
	let naming = {stateTiddlerTitle: this.stateTiddlerTitle, targetTiddlerTitle: this.targetTiddlerTitle, stateFieldPrefix: stateFieldPrefix, dynamicTagFieldPrefix: dynamicTagFieldPrefix, dynamicTagFieldCount: 0};
	
	//delete stateTiddler if exists
	this.wiki.deleteTiddler(this.stateTiddlerTitle);
	
	let stateTiddlerObject = {title: this.stateTiddlerTitle};
	if(!this.existingTargetTiddler){
		// handle prefill
		for(var fieldname in model.fields){
			let prefill = this.getAttribute("prefill:" + fieldname);
			if(prefill){
				this.logger.log("Prefilling '" + fieldname + "' with '" + prefill + "'");
				stateTiddlerObject[naming.stateFieldPrefix + fieldname] = prefill;
			}
		}
	}else{
		// fill state-tiddler from already existing targetTiddler
		for(var fieldname in model.fields){
			let oldValue = this.existingTargetTiddler["fields"][fieldname];
			if(oldValue){
				this.logger.log("Fill '" + fieldname + "' with '" + oldValue + "' from existing targetTiddler");
				stateTiddlerObject[naming.stateFieldPrefix + fieldname] = oldValue;
			}
		}
	}
	this.wiki.addTiddler(stateTiddlerObject);
	
	this.makeChildWidgets(this.createEditor(model, naming));
};

RenderWidget.prototype.createEditor = function(model, naming){
	let editorTemplate = DEFAULT_EDITOR_TEMPLATE;
	let stateTiddlerTitle = naming.stateTiddlerTitle;
	let targetTiddlerTitle = naming.targetTiddlerTitle;
	let headline = model.headline;
	this.innerMostChildrenArray = [];
	
	var	result = [
    {
        "type": "importvariables",
        "attributes": {
            "filter": {
                "type": "string",
                "value": "[[" + editorTemplate + "]]"
            }
        },
        "children": [
            {
                "type": "set",
                "attributes": {
                    "name": {
                        "type": "string",
                        "value": "saveAction"
                    },
                    "value": {
                        "type": "string",
                        "value": "<<save-$fieldName$>>"
                    }
                },
                "params": [
                    {
                        "name": "fieldName"
                    }
                ],
                "isMacroDefinition": true,
                "children": [
                    {
                        "type": "set",
                        "attributes": {
                            "name": {
                                "type": "string",
                                "value": "headline"
                            },
                            "value": {
                                "type": "string",
                                "value": headline
                            }
                        },
                        "params": [],
                        "isMacroDefinition": true,
                        "children": [
                            {
                                "type": "set",
                                "attributes": {
                                    "name": {
                                        "type": "string",
                                        "value": "store-actions"
                                    },
                                    "value": {
                                        "type": "string",
                                        "value": this.addAdditionalPreSaveActions(naming) + "<$list filter=\"[enlist<fields>]\" variable=\"field\">\n<$macrocall $name=\"saveAction\" fieldName=<<field>>/>\n</$list>" + this.addAdditionalPostSaveActions(naming)
                                    }
                                },
                                "params": [],
                                "isMacroDefinition": true,
                                "children": [
                                    {
                                        "type": "set",
                                        "attributes": {
                                            "name": {
                                                "type": "string",
                                                "value": "stateTiddler"
                                            },
                                            "value": {
                                                "type": "string",
                                                "value": stateTiddlerTitle
                                            }
                                        },
                                        "params": [],
                                        "isMacroDefinition": true,
                                        "children": [
                                            {
                                                "type": "set",
                                                "attributes": {
                                                    "name": {
                                                        "type": "string",
                                                        "value": "targetTiddler"
                                                    },
                                                    "value": {
                                                        "type": "string",
                                                        "value": targetTiddlerTitle
                                                    }
                                                },
                                                "params": [],
                                                "isMacroDefinition": true,
                                                "children": this.innerMostChildrenArray
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
  ];
	this.addFieldsAndEntryPoint(model, naming);
	return result;
}

RenderWidget.prototype.addAdditionalPreSaveActions = function(naming){
	let model = this.model;
	let result = "";
	if(!this.existingTargetTiddler){
		let tags = [];
		if(model.tagging && model.tagging.static){
			tags = model.tagging.static;
		}
		if(this.additionalTags){
			tags.push(this.additionalTags);
		}
		result += "<$action-setfield $tiddler=\"" + naming.targetTiddlerTitle + "\" $field=\"tags\" $value=\"" + tags.join(" ") + "\"/>";
	}
	return result;
}

RenderWidget.prototype.addAdditionalPostSaveActions = function(naming){
	let model = this.model;
	let result = "";
	if(this.popupState){
		result += "<$action-deletetiddler $tiddler=\"" + this.popupState + "\"/>";
	}
	if(model.actions && model.actions["after-creation"] && model.actions["after-creation"].openCreatedTiddler){
		result += "<$action-navigate $to=\"" + naming.targetTiddlerTitle + "\"/>";
	}
	return result;
}
	
const DEFAULT_TYPE_TO_EDITWIDGET_MAPPINGS = {
	"single-line-text": "$:/plugins/rimir/data-type-description/templates/editor/edittextwidget-singleline",
	"single-select": "$:/plugins/rimir/data-type-description/templates/editor/selectwidget-single",
	"multi-line-text": "$:/plugins/rimir/data-type-description/templates/editor/edittextwidget-multiline",
	"multi-select": "$:/plugins/rimir/data-type-description/templates/editor/selectwidget-multi",
	"multi-checkbox": "$:/plugins/rimir/data-type-description/templates/editor/checkboxwidget-multi",
	"radio": "$:/plugins/rimir/data-type-description/templates/editor/radiowidget",
	"date-and-time": "$:/plugins/rimir/data-type-description/templates/editor/editdateandtime-widget"
}

const UNKNOWN_EDITWIDGET_TIDDLER = "$:/plugins/rimir/data-type-description/templates/editor/non-existant";
const DEFAULT_SAVE_TO_FIELD_ACTION = "$:/plugins/rimir/data-type-description/templates/editor/simple-setfield-actions";
const DEFAULT_ADD_TO_TAGS_ACTION = "$:/plugins/rimir/data-type-description/templates/editor/simple-addtag-actions";
	
RenderWidget.prototype.getEditWidgetDescription = function(typeString){
	let editWidgetTiddler = DEFAULT_TYPE_TO_EDITWIDGET_MAPPINGS[typeString];
	if(!editWidgetTiddler){
		// maybe custom edit-widget
		let widgetTiddler = this.wiki.getTiddler(typeString);
		if(widgetTiddler){
			editWidgetTiddler = typeString;
		}else{
			editWidgetTiddler = UNKNOWN_EDITWIDGET_TIDDLER;
		}
	}
	// determine save-action for widget
	let widgetTiddler = this.wiki.getTiddler(editWidgetTiddler);
	if(!widgetTiddler){
		widgetTiddler = this.wiki.getTiddler(UNKNOWN_EDITWIDGET_TIDDLER);
	}
	let saveToFieldActionsTiddler = widgetTiddler["fields"]["rimir.dtd.save2field-action"];
	if(!saveToFieldActionsTiddler){
		saveToFieldActionsTiddler = DEFAULT_SAVE_TO_FIELD_ACTION;
	}
	let addToTagsActionsTiddler = widgetTiddler["fields"]["rimir.dtd.add2tags-action"];
	if(!addToTagsActionsTiddler){
		addToTagsActionsTiddler = DEFAULT_ADD_TO_TAGS_ACTION;
	}
	return {editWidgetTiddler: editWidgetTiddler, saveToFieldActionsTiddler: saveToFieldActionsTiddler, addToTagsActionsTiddler: addToTagsActionsTiddler};
}
	
const DYNAMIC_TAG_FIELDNAME_PREFIX = "dynamic_tags_";

RenderWidget.prototype.addFieldsAndEntryPoint = function(model, naming){
	for(var fieldname in model.fields) {
		let fieldDescription = model.fields[fieldname];
		let typeString = "single-line-text";
		if(fieldDescription.editor && fieldDescription.editor.type){
			typeString = fieldDescription.editor.type;
		}
		const editWidgetDescription = this.getEditWidgetDescription(typeString);
		
		let rememberedInnerMostChildrenArray = this.innerMostChildrenArray;
		rememberedInnerMostChildrenArray.push(this.createFieldMacros(fieldname, fieldDescription, editWidgetDescription, naming));
		rememberedInnerMostChildrenArray = this.innerMostChildrenArray;
		rememberedInnerMostChildrenArray.push(this.createSaveMacro(fieldname, fieldDescription, editWidgetDescription.saveToFieldActionsTiddler, naming));
	}
	if(!this.existingTargetTiddler && model.tagging && model.tagging.dynamic){
		let tagFields = model.tagging.dynamic;
		for (let i=0; i<tagFields.length; i++) {
			let fieldDescription = tagFields[i];
			let fieldname = DYNAMIC_TAG_FIELDNAME_PREFIX + i;

			let typeString = "single-line-text";
			if(fieldDescription.editor && fieldDescription.editor.type){
				typeString = fieldDescription.editor.type;
			}
			const editWidgetDescription = this.getEditWidgetDescription(typeString);

			let rememberedInnerMostChildrenArray = this.innerMostChildrenArray;
			rememberedInnerMostChildrenArray.push(this.createFieldMacros(fieldname, fieldDescription, editWidgetDescription, naming));
			rememberedInnerMostChildrenArray = this.innerMostChildrenArray;
			rememberedInnerMostChildrenArray.push(this.createSaveMacro(fieldname, fieldDescription, editWidgetDescription.addToTagsActionsTiddler, naming));;
		}
	}
	this.innerMostChildrenArray.push(createEntryPoint(model));
}
	
RenderWidget.prototype.createSaveMacro = function(fieldName, fieldDescription, templateTiddler, naming){
	this.innerMostChildrenArray = [];
	let id = fieldName;
	
	var result = {
		"type": "set",
		"attributes": {
			"name": {
				"type": "string",
				"value": "save-" + id
			},
			"value": {
				"type": "string",
				"value": createSaveMacroContent(id, fieldDescription, templateTiddler)
			}
		},
		"params": [],
		"isMacroDefinition": true,
		"children": this.innerMostChildrenArray
	};
	return result;
}
	
RenderWidget.prototype.createFieldMacros = function(fieldName, fieldDescription, editWidgetDescription, naming){
	this.innerMostChildrenArray = [];
	let id = fieldName;
	let caption = fieldDescription.caption;
	
	var result = {
		"type": "set",
		"attributes": {
			"name": {
				"type": "string",
				"value": "stateFieldName-" + id
			},
			"value": {
				"type": "string",
				"value": naming.stateFieldPrefix + fieldName
			}
		},
		"params": [],
		"isMacroDefinition": true,
		"children": [
			{
				"type": "set",
				"attributes": {
					"name": {
						"type": "string",
						"value": "targetFieldName-" + id
					},
					"value": {
						"type": "string",
						"value": fieldName
					}
				},
				"params": [],
				"isMacroDefinition": true,
				"children": [
					{
						"type": "set",
						"attributes": {
							"name": {
								"type": "string",
								"value": "name-" + id
							},
							"value": {
								"type": "string",
								"value": caption
							}
						},
						"params": [],
						"isMacroDefinition": true,
						"children": [
							{
								"type": "set",
								"attributes": {
									"name": {
										"type": "string",
										"value": "edit-" + id
									},
									"value": {
										"type": "string",
										"value": createEditorMacroContent(id, fieldDescription, editWidgetDescription.editWidgetTiddler)
									}
								},
								"params": [],
								"isMacroDefinition": true,
								"children": this.innerMostChildrenArray
							}
						]
					}
				]
			}
		]
	};
	return result;
}

function createEditorMacroContent(id, fieldDescription, templateTiddler) {
	return createDefaultMacroContent(id, fieldDescription, templateTiddler);
}
	
function createSaveMacroContent(id, fieldDescription, templateTiddler) {
	return createDefaultMacroContent(id, fieldDescription, templateTiddler);
}
	
function createDefaultMacroContent(id, fieldDescription, templateTiddler) {
	var result = createVarsMacro(id, fieldDescription) + "\n<$transclude tiddler=\"" + templateTiddler + "\"/>\n</$vars>";
	return result;
}

function createVarsMacro(id, fieldDescription){
	let result = "<$vars rimir-dtd:targetTiddler=<<targetTiddler>> rimir-dtd:targetField=<<targetFieldName-" + id + ">> rimir-dtd:stateTiddler=<<stateTiddler>> rimir-dtd:stateField=<<stateFieldName-" + id + ">> rimir-dtd:filter=\"" + createFilterFromTypeArray(fieldDescription.types) + "\"" + addCustomVariables(fieldDescription) + ">";
	return result;
}
	
function createFilterFromTypeArray(types){
	let result = "";
	if(types){
		for(let i=0; i<types.length; i++){
			result += "[tag[" + types[i] + "]subfilter<rimir:narrowByStateFilter>]";
		}
	}
	return result;
}
	
function addCustomVariables(fieldDescription){
	let result = "";
	if(fieldDescription.editor && fieldDescription.editor["widget-specific-conf"]){
		for(var custom in fieldDescription.editor["widget-specific-conf"]){
			result += " rimir-dtd:custom:" + custom + "=\"" + fieldDescription.editor["widget-specific-conf"][custom] + "\"";
		}
	}
	return result;
}
	
function createEntryPoint(model){
	let fieldList = "";
	let firstRun = true;
	for(var fieldname in model.fields) {
		if(!firstRun){
			fieldList += " ";
		}
		fieldList += fieldname;
		firstRun = false;
	}
	if(model.tagging && model.tagging.dynamic){
		let tagFields = model.tagging.dynamic;
		for (let i=0; i<tagFields.length; i++) {
			if(!firstRun){
				fieldList += " ";
			}
			fieldList += DYNAMIC_TAG_FIELDNAME_PREFIX + i;
			firstRun = false;
		}
	}
	var result = {
		"type": "set",
		"attributes": {
			"name": {
				"name": "name",
				"type": "string",
				"value": "fields",
			},
			"value": {
				"name": "value",
				"type": "string",
				"value": fieldList,
			}
		},
		"tag": "$set",
		"isBlock": false,
		"children": [
			{
				"type": "text",
				"text": "\n"
			},
			{
				"type": "macrocall",
				"name": "editor",
				"params": []
			},
			{
				"type": "text",
				"text": "\n"
			}
		]
	};
	return result;
}

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RenderWidget.prototype.refresh = function(changedTiddlers) {
	this.logger.log("RenderWidget: Calling refresh()");
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
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

// UTILS END

exports["dasma-editor"] = RenderWidget;

})();
