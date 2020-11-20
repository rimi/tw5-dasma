/*
Model Repo for our DASMA-Files.
*/

(function(){

"use strict";

var test_model_01 = {
	headline: "XXX Create a <DEFAULT> entity XXX",
	tagging: {
    static: ["meeting-note"],
    dynamic: [
      {
        caption: "Stakeholder",
        types: ["person"],
        editor: {
          type: "multi-select",
          "widget-specific-conf": {
            numOfVisibleElements: "2"
          }
        }
      }
    ]
	},
	title: {
		template: "meeting-notes/${this.now}"
	},
	fields: {
		caption: {
			caption: "Caption",
			type: "single-line-text"
		},
		description: {
			caption: "Description",
			type: "multi-line-text"
		},
		"participant.refs": {
			caption: "Participants",
			type: "multi-select",
			size: "5",
			filter: "[tag[person]]"
		},
		"creation-context.ref": {
			caption: "Creation Context",
			type: "single-line-text"
		},
		task: {
			caption: "Task",
			type: "single-select",
			size: "3",
			filter: "[tag[task]]"
		}
	},
	actions: {
		"after-creation" : {
			openCreatedTiddler: true
		}
	}
};
	
let allExistingModels;
let logger;

function init() {
    logger = new $tw.utils.Logger("rimir:dtd-model", {enable: false});
    logger.log("Calling init()");
    $tw.wiki.filterTiddlers("[tag[data-type-desc]]").forEach(jsonModelTiddlerName => addModelFromTiddler(jsonModelTiddlerName, allExistingModels));
    logger.log("Initialized DTD-Models:");
    logger.log(allExistingModels);
}
	
exports.getModel = function(key){
    if(!allExistingModels){
        allExistingModels = {};
        init();
    }
    logger.log("Looking up for model: " + key);
    var result = allExistingModels[key];
    if(!result){
        result = test_model_01;
    }
    return result;
}
	
function addModelFromTiddler(jsonModelTiddlerName, targetModelContainer){
    logger.log("Handling: " + jsonModelTiddlerName);
    let modelTiddler = $tw.wiki.getTiddler(jsonModelTiddlerName);
    if(modelTiddler){
        try {
            let model = JSON.parse(modelTiddler.fields.text);
            targetModelContainer[jsonModelTiddlerName] = model;
            logger.log("Registered DTD-Model from: " + jsonModelTiddlerName);
            var modelTypeTag = modelTiddler.fields["type-tag"];
            if(modelTypeTag){
                targetModelContainer[modelTypeTag] = model;
                logger.log("Also registering it for type-tag: " + modelTypeTag);
            }
        } catch(e) {
            //use a test-model if content is no JSON
            //todo: $:/tags/Alert
        }
    }else{
        //use a test-model if model-tiddler does not exist
        //todo: $:/tags/Alert
    }
}
	
})();

