// The javascript promise library that allows you to defer the stack easily to a lower level
(function(){
	"use strict";
	// the reason I use a variable like this is because closure compiler automaticly inlines and optimizes it
	///////////////////////
	const DEBUGMODE = true;
	///////////////////////
	const persuadoStack = []; // Defered loading of promises to outermost promise scope so as to not exceed the stack level
	const promiseBufferLvl = 256; // length of the promise buffer for double stack buffering
	var deferLevel = 0;
	var isInsideDeferable = false; // because javascript is single threaded, we can use this to determine if there is an outermost promise
	var pStackLength = 0;		 // the current size of the persuadoStack
	window["DeferStack"] = function(func, start){
		start = +start || 1;
		if (isInsideDeferable) {
			persuadoStack.push(func);
			++pStackLength;
		} else {
			if (deferLevel >= promiseBufferLvl){
				isInsideDeferable = true;
				persuadoStack.push(func);
				++pStackLength;
			} else {
				if (deferLevel)
					++deferLevel;
				else
					deferLevel = start;
				func();
				if (deferLevel === start) { // if this is the outermost promise
					try {
						if (pStackLength) {
							do {
								isInsideDeferable = false;
								persuadoStack.shift()();
							} while (--pStackLength);
						}
						isInsideDeferable = false;
						deferLevel = 0;
					} catch(e) {
						// reset everything so that the error doesn't permanently ruin everything
						isInsideDeferable = false;
						deferLevel = 0;
						persuadoStack.length = pStackLength = 0;
						throw e;
					}
				} else --deferLevel;
			}
		}
	}
})();
