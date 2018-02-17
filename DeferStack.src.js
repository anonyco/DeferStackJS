// The javascript promise library that allows you to defer the stack easily to a lower level
(function(){
	"use strict";
	// the reason I use a variable like this is because closure compiler automaticly inlines and optimizes it
	///////////////////////
	const DEBUGMODE = true;
	///////////////////////
	const persuadoStack = []; // Defered loading of promises to outermost promise scope so as to not exceed the stack level
	const transPersuadoStack = []; // temporary buffer for the persuado stack
	const promiseBufferLvl = 256; // length of the promise buffer for double stack buffering
	var deferLevel = 0;
	var isAtHigherLvl = false;
	var isInsideDeferable = false; // because javascript is single threaded, we can use this to determine if there is an outermost promise
	var pStackLength = 0;		 // the current size of the persuadoStack
	var previous
	/** @noCollapse */
	window["DeferStack"] = function(func, start){
		if (DEBUGMODE){
			if (typeof func !== "function") console.error("The first argument to DeferStack must be a function.");
			if (start !== undefined && typeof start !== "number") console.error("The second argument to DeferStack must be a number or undefined (for the default).");
		}
		if (isInsideDeferable) {
			transPersuadoStack.unshift(func);
			++pStackLength;
		} else {
			if (isAtHigherLvl) {
				if (deferLevel >= promiseBufferLvl){
					isInsideDeferable = true;
					transPersuadoStack.unshift(func);
					++pStackLength;
				} else {
					++deferLevel;
					func();
				}
			} else {
				deferLevel = start || 1;
				isAtHigherLvl = true;
				func();
				if (isInsideDeferable) { // if this is the outermost promise
					try {
						do {
							deferLevel = start || 1;
							if (isInsideDeferable) {
								// if some stuff got added onto the transPersuadoStack
								persuadoStack.push.apply(persuadoStack, transPersuadoStack);
								transPersuadoStack.length = 0;
								isInsideDeferable = false;
							}
							persuadoStack.pop()();
						} while (--pStackLength);
					} catch(e) {
						// reset everything so that the error doesn't permanently ruin everything
						if (DEBUGMODE) console.error(e);
					}
				}
				isInsideDeferable = isAtHigherLvl = false;
				deferLevel = persuadoStack.length = pStackLength = 0;
			}
		}
	}
})();
