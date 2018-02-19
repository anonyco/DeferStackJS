# DeferStackJS
DeferStackJS is the fastest (to my knowlege) "Maximum Stack Call Exceeded" error work around all in 298 bytes ungziped (only 237 bytes with gzip). If you need a more complete solution for calling functions after a defered function or getting the return value of a defered function, consider using a promise library such as my own [PromiseMeSpeedJS](https://github.com/anonyco/PromiseMeSpeedJS/).

### Quick Start

To use, simply drop the following snippet of HTML code into your `<head>` before all of the scripts that use PromiseMeSpeed.
```HTML
<script src="https://dl.dropboxusercontent.com/s/oiglofuxa20b29r/DeferStackDEBUG.min.js?dl=0"></script>
```
Or, alternatively if you want faster page loading, add a defer to every script to let the browser know that you don't call evil `document.write` inside your script.<br /><br />
*Before:*
```HTML
<!doctype HTML>
<html><head>
<script src="https://dl.dropboxusercontent.com/s/oiglofuxa20b29r/DeferStackDEBUG.min.js?dl=0"></script>
<script src="/path/to/my/script.js"></script>
</head><body>
    ...
</body></html>
```
*After*
```HTML
<!doctype HTML>
<html><head>
<script src="https://dl.dropboxusercontent.com/s/oiglofuxa20b29r/DeferStackDEBUG.min.js?dl=0" defer=""></script>
<script src="/path/to/my/script.js" defer=""></script>
</head><body>
    ...
</body></html>
```

### API

DeferStackJS adds one and only one new method to the window object: `window.DeferStack` as shown by the persuado diagram below.

```Javascript
function DeferStack(Function f_x, /*Optional*/ int stackStartLevel);
```

As seen above, `window.DeferStack` can accept one or two paramters. The first parameter, *f_x*, is the function to be defered.  The *stackStartLevel* parameter only gets applied to the outermost DeferStack. However, you are not yet ready to start using defer stack just yet! You must read the section *Integrating Deferstack Into Your Code* first.

### Integrating Deferstack Into Your Code (!IMPORANT!)
While the API may sound simple, putting DeferStackJS into existing code can be much harder. This challenge is because as great as DeferStackJS is, DeferStackJS simply cannot work magic. Basically, to ensure that your code executes linearly, you must make a call to defer stack at the two following areas of your code:
 
1. At calls to linearly executed action.
2. At calls that loop through many new items.

For example, let's examine the following code.
```Javascript
// A recursive for each iterator on an object
function forEachRecursive(obj, funcAppliedToEach) {
	"use strict";
	for (var key in obj) {
		funcAppliedToEach(obj[key], key, obj);
		if (typeof obj[key] === "object") {
			forEachRecursive(obj[key], funcAppliedToEach);
		}
	}
}
```
Then, to convert it to using DeferStackJS, we must use the two rules shown above. Using theese two rules yeilds the following code:

```Javascript
var DeferStack = window.DeferStack;
function forEachRecursive(obj, funcAppliedToEach) {
	"use strict";
	for (var key in obj) {
		DeferStack( funcAppliedToEach.bind(undefined, obj[key], key, obj) );
		if (typeof obj[key] === "object") {
			DeferStack( forEachRecursive.bind(undefined, obj[key], funcAppliedToEach) );
		}
	}
}
```

### Example

Try running the code below in the console (press Ctrl+Shift+I in Chrome).

```Javascript
(function(){
	"use strict";
	(function(){var d=[],a=0,b=!1,c=0;window.DeferStack=function(f,e){e=+e||1;if(b)d.push(f),++c;else if(256<=a)b=!0,d.push(f),++c;else if(a?++a:a=e,f(),a===e)try{if(c){do b=!1,d.shift()();while(--c)}b=!1;a=0}catch(g){throw b=!1,a=0,d.length=c=0,g;}else--a}})(); // DeferStack.min.js
	var DeferStack = window.DeferStack;
	var start = performance.now();
	var i = 3000000; // 3 million iterations
	DeferStack(function test(){
		if (!--i) {
			var end = performance.now();
			console.log("Finished in " + (end-start) + "ms");
			return; // prevent an infinite loop
		}
		DeferStack(test);
	});
})();
```

### The StackLevel

For maximum performance, DeferStackJS does not completely disreguard the browser's native stack. Rather, it merely buffers it. The second parameter, *stackStartLevel*, allows you to control this to allow the maximum buffering for the best performance. *stackStartLevel* is the value the internal counter starts at. Once the counter reaches 256 (DeferStack called inside of DeferStack 256 times), the function to be called gets put in the synchonous buffer and executed at a lower stack level. For example, compare the performance of reduceing the stack buffer
```Javascript
(function(){
    "use strict";
    (function(){var d=[],a=0,b=!1,c=0;window.DeferStack=function(f,e){e=+e||1;if(b)d.push(f),++c;else if(256<=a)b=!0,d.push(f),++c;else if(a?++a:a=e,f(),a===e)try{if(c){do b=!1,d.shift()();while(--c)}b=!1;a=0}catch(g){throw b=!1,a=0,d.length=c=0,g;}else--a}})();
	var DeferStack = window.DeferStack;
	var start = performance.now();
    var i = 3000000; // 3 million iterations
    DeferStack(function test(){
        if (!--i) {
			var end = performance.now();
			console.log("Finished in " + (end-start) + "ms");
			return; // prevent an infinite loop
        }
        DeferStack(test);
    });
})();
```

However, if we decrease the bufferlevel down to 4 then the speed greatly decreases.

```Javascript
(function(){
    "use strict";
    (function(){var d=[],a=0,b=!1,c=0;window.DeferStack=function(f,e){e=+e||1;if(b)d.push(f),++c;else if(256<=a)b=!0,d.push(f),++c;else if(a?++a:a=e,f(),a===e)try{if(c){do b=!1,d.shift()();while(--c)}b=!1;a=0}catch(g){throw b=!1,a=0,d.length=c=0,g;}else--a}})();
	var DeferStack = window.DeferStack;
	var start = performance.now();
    var i = 3000000; // 3 million iterations
    DeferStack(function test(){
        if (!--i) {
			var end = performance.now();
			console.log("Finished in " + (end-start) + "ms");
			return; // prevent an infinite loop
        }
        DeferStack(test);
    }, 252); // only a buffer of 4
})();
```

However, if we increase the bufferlevel by 65536, then we get a "Maximum stack call exceeded" error in Chrome.

```Javascript
(function(){
    "use strict";
    (function(){var d=[],a=0,b=!1,c=0;window.DeferStack=function(f,e){e=+e||1;if(b)d.push(f),++c;else if(256<=a)b=!0,d.push(f),++c;else if(a?++a:a=e,f(),a===e)try{if(c){do b=!1,d.shift()();while(--c)}b=!1;a=0}catch(g){throw b=!1,a=0,d.length=c=0,g;}else--a}})();
	var DeferStack = window.DeferStack;
	var start = performance.now();
    var i = 3000000; // 3 million iterations
    DeferStack(function test(){
        if (!--i) {
			var end = performance.now();
			console.log("Finished in " + (end-start) + "ms");
			return; // prevent an infinite loop
        }
        DeferStack(test);
    }, -65536); // increase by 65536
})();
```

Thus, this is why you must be very careful when messing with the stack level: Some levels will work in some browsers while erroring in other browsers. Thus, it is reccomended that you always keep a very safe distance between you and a "Maximum stack call exceeded" error.

### Faster Version of DeferStack
For many, the default version of defer stack may be 'good enough.' However, it includes nonessential type checks to make sure you are passing the right types of arguments to DeferStack. However, theese extra checks consume extra CPU power. Thus, there is an alternative version of DeferStack without theese checks for the maximum performance. If you are still a novice at javascript, then it is reccomended that this version is not used during development.

```HTML
<script src="https://dl.dropboxusercontent.com/s/wvwyrzx557eqi0v/DeferStack.min.js?dl=0" defer=""></script>
```

### Advanced usage help

The passed function can be any function, including a closure. Thus, you can do things like so.


```Javascript
var DeferStack = window.DeferStack; // for the best performance, declare DeferStack as a local variable
function flatten(obj){
  var resultingArray = [];
  (function recurse(obj){
    var entries = Object.entries( obj );
    Array.prototype.push.apply( resultingArray, entries );
    entries.forEach(function(obj){
      if (typeof obj === "object")
        DeferStack(function(){
          // this function is a closure
          recurse(obj);
        });
    });
  })(obj);
  return resultingArray;
}
```

### How the Internals work

You are probably interested in how something so small and so simple can do so much. Thus, the following is a description of how the internals work. If you can `window.DeferStack` inside *f_x* enough times, then it stopes executing the function immediatly and instead adds the function to an internal que before bubbles downward toward the outermost call to `window.DeferStack` at a lower stack level. Then, the `window.DeferStack` executes all the functions in the internal que until they bubble up to too high of a stack level. This is repeated until there are no items left in the internal que. This is also why using this library can be dangerous: if you accidentally cause an infinite loop then its going to keep on going forever because there is no maximum stack call to stop it. For example, the following code will continue to infinitum or at least until the user gets frustrated enough and force powers off their PC. YOU HAVE BEEN WARNED: AVOID CODE LIKE SHOWN BELOW

```Javascript
var DeferStack = window.DeferStack; // for the best performance, declare DeferStack as a local variable
function flatten(obj){
  var resultingArray = [];
  (function recurse(obj){
    var entries = Object.entries( obj );
    Array.prototype.push.apply( resultingArray, entries );
    DeferStack(entries.forEach.bind(entries, function(obj){
      if (typeof obj === "object")
        recurse(obj);
      else
      	resultingArray.push(obj);
    }));
  })(obj);
  return resultingArray;
}

var circularObj = {};
circularObj.circularObj = circularObj; // This creates a circular reference. This is valid javascript, and this is very scary.

console.log(flatten(circularObj)); // will never finish
```

If you are worried about circular references like the one in the example above, then you could simply add a weakset to keep track of all of the objects you have done so far.

```Javascript
var DeferStack = window.DeferStack; // for the best performance, declare DeferStack as a local variable
function circularSafeFlatten(obj){
  var resultingArray = [], doneObject = new WeakSet();
  (function recurse(obj){
    /*********************************/
    // The following code makes the flattener a noticable amount slower, but protects you from circular references
    if (doneObject.has(obj)) return;
    else doneObject.add(obj);
    /*********************************/
    var entries = Object.entries( obj );
    Array.prototype.push.apply( resultingArray, entries );
    DeferStack(entries.forEach.bind(entries, function(obj){
      if (typeof obj === "object")
      	recurse(obj);
      else
      	resultingArray.push(obj);
    }));
  })(obj);
  return resultingArray;
}

var circularObj = {};
circularObj.circularObj = circularObj;

console.log(circularSafeFlatten(circularObj)); // will return immediatly
```

If you need to support browsers that don't natively support WeakMaps, then I would reccomend my own [Javascript-Fast-Light-Map-WeakMap-Set-And-WeakSet-JS-Polyfill](https://github.com/anonyco/Javascript-Fast-Light-Map-WeakMap-Set-And-WeakSet-JS-Polyfill) polyfill.










