if (typeof(__dumpName__) == "undefined")
	var __dumpName__ = "log";


(function (_func)
{
	this[_func] = function (aMessage, obj, param)
	{

		if (typeof(param) == "undefined")
			param = {};

		if (typeof(param) != "object")
			param = {prefix: param};

		if (!("getParam" in param))
			param.getParam = new _getParam(param);


		let getParam = param.getParam,
				objectId = getParam("objectId", new _objectId()),
				prefix = getParam("prefix", ""),
				title = getParam("title", "dump"),
				parent = getParam("parent", aMessage),
				file = getParam("file", null),
				callerIndex = getParam("callerIndex", 2),//index in error.stack
				stack = getParam("stack", undefined),
				parentName = getParam("parentName", ""),
				showType = getParam("showType", 1),
				tab = getParam("tab", 0),
				sort = getParam("sort", 1), //0 = none, 1 = case sensetive, 2 = case insensitive
				showEnd = getParam("showEnd", 5), //show "//objectname" if object has more then NN lines
				showCaller = getParam("showCaller", 7), //show caller's filename 0 = none, 1 = filename, 2 = foldername, 4 = relative path
				tabs2spaces = getParam("tabs2spaces", 2), //replace all tabs with NN spaces
				logLevel = getParam("logLevel", 2), //bitwise
				type = getParam("type", 0), // 0 = information, 2 = warning, 3 = error
				filePerm = false,
				fileBackup = dumpFile,
				c = getParam("c", 0),
				t = getParam("typeof", stack && !type ? "error" : typeof(aMessage)),
				id = "",
				t2,
				ret = "",
				append = "",
				tText = "",
				t2Text = "",
				caller_line = "",
				caller_file = "",
				caller_file_full = "",
				caller_file_array = [];

		if (!logLevel)
			return;

		if (stack && !(logLevel & 1))
			return;

		if (!(logLevel & 2))
			return;

		if (file !== null)
		{
			try
			{
				let erase = false;
				if (typeof(file) == "object")
				{
					erase = file.erase;
					filePerm = file.perm;
					file = file.file;
				}
				if (file !== "")
				{
					file = file.replace(/\\/g, "/");
					if (file.indexOf("/") == -1)
						file = _func.dir + _func.folder + "/" + file;

					fileInit(file, erase);
					param.file = dumpFile;
				}
				else
				{
					dumpFile = null;
				}
			}
			catch(e){_func(e, 1)}
		}

/*
		if (typeof(tab) == "undefined")
		{
			cache = {
				id: 1
			};
		}
*/
		if (showCaller)
		{
			caller_line = getCaller(callerIndex, stack);
			if (callerIndex != -1)
			{
				let file_array = [];
				for (let i = 0; i < caller_line.length; i++)
				{
					let cl = caller_line[i],
							line = cl.match(/(:[0-9]+(:[0-9]+)?)/);
					if (line)
						line = line[1];

					let url = cl.replace(/(:[0-9]+(:[0-9]+)?)/, "");
					url = getLocalPath(url);
					if (!url)
						url = "unknown";

					caller_file_full = url.replace(/^[\/\\]/, "");
					caller_file = url.replace(_func.dir, "").replace(/^[\/\\]/, "") + line;
					caller_file = caller_file.replace(/\\/g, "/");
					caller_file_array.push(caller_file);
					let file = "";

					if (showCaller & 4 && /^resource:/.test(caller_file))
						file = caller_file;
					else
					{
						let f = caller_file.split("/");
						if (showCaller & 4)
							for(let i = 1; i < f.length - 1; i++)
								file += (file ? "/" : "") + f[i];

						if (showCaller & 2)
							file = _func.folder + (file ? "/" : "") +  file;

						if (showCaller & 1)
							file += (file ? "/" : "") + f[f.length - 1];
					}
					file_array.push(file);
				}
				file = file_array.join("\n");
				caller_line = title !== "" && !type ? " (" + file + ")" : file;
			}
			else
			{
				caller_line = title !== "" && !type ? " (" + caller_line.join("\n") + ")" : caller_line.join("\n");
			}
		}
		if (showType)
			tText = "(" + t + ")";

		if (obj && (t == "object" || t == "function") && aMessage !== null)
		{
			try
			{
				let array = new Array();
				for(let i in aMessage)
					array.push(i);

				if (sort)
				{
					if (sort == 2)
					{
						array.sort(function (a, b)
						{
							function chunkify(t)
							{
								let tz = [], x = 0, y = -1, n = 0, i, j;

								while (i = (j = t.charAt(x++)).charCodeAt(0))
								{
									let m = (i == 46 || (i >=48 && i <= 57));
									if (m !== n)
									{
										tz[++y] = "";
										n = m;
									}
									tz[y] += j;
								}
								return tz;
							}

							let aa = chunkify(a.toLowerCase()),
									bb = chunkify(b.toLowerCase()),
									x, c, d;

							for (x = 0; aa[x] && bb[x]; x++)
							{
								if (aa[x] !== bb[x])
								{
									c = Number(aa[x]), d = Number(bb[x]);
									if (c == aa[x] && d == bb[x])
									{
										return c - d;
									}
									else
										return (aa[x] > bb[x]) ? 1 : -1;
								}
							}
							return aa.length - bb.length;
						});
					}
					else
						array.sort();
				}

				for(let ii = 0; ii < array.length; ii++)
				{
					id = array[ii];
					if (id == "___obj_id")
						continue;

					if (showType)
						t2Text = " (unknown)";
					try
					{
						try
						{
							t2 = typeof(aMessage[id]);
						}
						catch(e)
						{
							t2 = "error";
						}
						if (showType)
							t2Text = " (" + t2 + ")";

						let text = aMessage[id];

						append = getTab(tab);

						try
						{
							text = text.toString();
							text = text.split("\n");
							for(let l = 1; l < text.length; l++)
								text[l] = append + text[l];

							let suffix = "";
							
							if (text.length > showEnd)
							{
								let funcName;
								if (t2 == "function")
								{
									funcName = text[0].match(/^(function[^\)]*\))/i)[1].replace(/(\s){2,}/g, "$1").replace(/,(?:[^\s])/g, ", ");
								}
								suffix = "//" + id + (t2 == "object" ? " (" + t2 + ")" : funcName ? " " + funcName : "");
							}

							text = text.join("\n") + suffix;
						}
						catch(e){}
						ret += append + id + t2Text + ": " + text;
					}
					catch(e)
					{
						ret += append + id + t2Text + ": " + e;
					}
					if ((t2 == "object" || t2 == "function") && aMessage[id] !== null && c < obj && !(tab && aMessage[id] == _func))
					{
							ret += "\n" + getTab(tab) + (t2 == "object" ? "{" : "") + "\n";

						let cid = objectId(aMessage[id]);
						if (!(cid in objectId.cache))
						{
							param.tab = tab + 4;
							param.parent = parent;
							param.c = c + 1;
							objectId.cache[cid] = _func(aMessage[id], obj, param);
						}
						ret += objectId.cache[cid];
						let suffix = "";
						if (objectId.cache[cid].split("\n").length > showEnd)
							suffix = "//" + id + " (" + t2 + ")";

							ret += getTab(tab) + ((t2 == "object") ? "}" : "") + suffix;
					}
					ret += "\n"
				}
			}
			catch(e)
			{
				ret += append + id + " (error): " + e + "\n" + e.stack + "\n";
			}
		}
		if (tab)
			return ret;

		let text = aMessage;
		if (t == "function")
		{
			text = String(text);
			let funcName = text.match(/^(function [^\)]*\))/i)[1];

			if (funcName)
			{
				text += "//" + funcName;
			}
		}
		let output = prefix + (prefix ? " " : "") + (tText ? tText + ":" : "") + text + (ret ? "\n" + ret : "");
		if (tabs2spaces)
			output = output.replace(/^(\t+)/mg, function(a)
			{
				return (new Array(a.length * tabs2spaces + 1)).join(" ");
			});


		if (type)
		{
			let	scriptError = Cc["@mozilla.org/scripterror;1"].createInstance(Ci.nsIScriptError),
					aFlags = type == 1 ? scriptError.warningFlag : scriptError.errorFlag,
					aMessage = title + " " + output + "\n" + (stack ? stack : ""),
					aSourceName = caller_file_full;
					aSourceLine = null,
					aLineNumber = caller_file.match(/:([0-9]+):([0-9]+)?$/),
					aColumnNumber = caller_file.match(/:([0-9]+):([0-9]+)?$/),
					aCategory = null;//"CM+";
			aLineNumber = aLineNumber ? aLineNumber[1] : null;
			aColumnNumber = aColumnNumber ? aColumnNumber[2] : null;
			scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber, aColumnNumber, aFlags, aCategory);
			Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logMessage(scriptError);
		}
		else
			Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService)
				.logStringMessage(title + caller_line + ": " + output);

		for (let o = 0; o < objectId.cacheObj.length; o++)
			delete objectId.cacheObj[o].___obj_id;

		if (!dumpFile)
		{
			if (dumpFile != fileBackup)
				dumpFile = fileBackup;

			return;
		}

		function right(str, n)
		{
			let s = String(str);
			if (n <= 0)
				return "";

			else if (n > s.length)
				return str;

			else
				return s.substring(s.length, s.length - n);

		}
		let d = new Date(),
				data = "[" + d.getFullYear()
								+ right("00" + d.getMonth() + 1, 2)
								+ right("00" + d.getDate(), 2)
								+ " "
								+ right("00" + d.getHours(), 2)
								+ right("00" + d.getMinutes(), 2)
								+ right("00" + d.getSeconds(), 2)
								+ "."
								+ right("000" + d.getMilliseconds(), 3)
								+ "] "
								+ caller_file_array.join("\n").replace(_func.folder + "/", "") + output + "\n";
		saveFile(dumpFile, data)
		if (file && !filePerm && fileBackup)
		{
			dumpFile = fileBackup;
		}
	}//dump(blah)

	_func = this[_func];

	_func.debug = function log_debug(text, totalTime)
	{
		if (!(_func.logLevel & 4))
			return;

		let eT = null;
		try
		{
			if (!totalTime || !(_____execDate in _func.debug.caller))
				_func.debug.caller._____execDate = new Date();
		}
		catch(e){}
		try
		{
			if (totalTime)
				eT = new Date() - (typeof(totalTime) == "function" ? totalTime._____execDate : _func.debug.caller._____execDate);
		}
		catch(e){}

		let caller = _func.debug.caller,
				args,
				_caller = "N/A",
				_arguments = "";
		if (caller)
		{
			args = caller.arguments;
			if (caller.name)
				_caller = caller.name;

			let n = 0,
					i;
			for(let i = 0; i < args.length; i++)
			{
				let quote = typeof args[i] == "string" ? '"' : "",
						arg;
				try
				{
					arg = args[i].toString();
				}
				catch(e)
				{
					arg = "undefined";
				}
				if (arg.length > 50)
					arg = arg.substr(0, 50) + " ...";

				_arguments += (_arguments ? ", " : "") + quote + arg + quote;

				n++;
			}
			if (n >= 10)
				_arguments += ", +" + (n - 10);

			_arguments = "(" + _arguments + ")";
		}
		_func((text ? "[" + text + "] ": "")
					+ _caller
					+ _arguments
					+ " execTime: "
					+ (eT === null ? _func.debug.startTime : eT + " [" + _func.debug.startTime + "]")
			, undefined, {logLevel: 2, callerIndex: 3, typeof: "debug"});
	}//debug()

	Object.defineProperty(_func.debug, "startTime", {
		get: function()
		{
			return this.startT ? new Date() - this.startT : "n/a";
		},
		set: function(s)
		{
			this.startT = s;
		}
	});

	_func.error = function log_error(err,prop)
	{
		if (typeof(err) != "object" || !("stack" in err))
		{
			let stack = (new Error).stack.split("\n");
			stack.splice(0, 1);
			_func(" " + err, 1, {stack: stack.join("\n"), callerIndex: 1, type: 2});
			return;
		}
		let l = err.stack.split("\n"),
				index = -1;
	
		if (prop && "callerIndex" in prop && l[prop.callerIndex])
			index = prop.callerIndex;
		else
		{
			for(let i in l)
				if (l[i].indexOf(" -> ") != -1)
				{
					index = i;
					break;
				}
		}
		_func(" " + err, 1, {callerIndex: index, stack: err.stack, type: 2});
	}//error()

	_func.debug.startT = new Date();

	function _getParam(param)
	{
		return function (id, d)
		{
			if (typeof(param[id]) == "undefined")
				param[id] = typeof(_func[id]) == "undefined" ? d : _func[id];

			return param[id];
		}
	}//getParam()

	function getCaller(callerIndex, stack)
	{
		let list = [" -> ", "@", "at "],
				index,
				stackList = (Array.isArray(callerIndex)) ? callerIndex : [callerIndex],
				r = [];

		stack = ((typeof(stack) == "undefined") ? (new Error).stack : stack).split("\n");

		if (stackList[0] == -1)
			return stack;

		for (let s = 0; s < stackList.length; s++)
		{
			let line = stack[stackList[s]];
			if (typeof(line) == "undefined")
				if (!r.length)
					line = stack[2];
				else
					continue;

			if (typeof(line) == "undefined")
				continue;

			for (let i = 0; i < list.length; i++)
			{
				let item = list[i];
				index = line.lastIndexOf(item);
				if (index != -1)
				{
					index += item.length;
					break;
				}
			}
			r.push(line.slice(index, line.length));
		}
		return r;
	}//getCaller()

	function _objectId()
	{
		let id = (new Date()).getTime(),
				cacheObj = [];
		function objectId(obj)
		{
			id++;
			if (!obj)
				return id;

			try
			{
				if (!obj.___obj_id)
				{
					obj.___obj_id = id;
					cacheObj.push(obj);
				}

				id = obj.___obj_id;
			}
			catch(e){}
			return id;
		}//objectId()
		objectId.cache = [];
		objectId.cacheObj = cacheObj;
		return objectId;
	}//_objectId()


//log(_objectId.cache = {test: "blah"}, 1);
	/**
	 * http://mxr.mozilla.org/mozilla-release/search?string=function+resolveURIToLocalPath
	 *
	 * Resolve a URI back to physical file.
	 *
	 * Of course, this works only for URIs pointing to local resources.
	 *
	 * @param  aURI
	 *         URI to resolve
	 * @return
	 *         resolved nsIURI
	 */
	function resolveURIToLocalPath(aURI) {
		let resolved;
		switch (aURI.scheme) {
			case "jar":
			case "file":
				return aURI;

			case "chrome":
				resolved = Cc["@mozilla.org/chrome/chrome-registry;1"].
									 getService(Ci.nsIChromeRegistry).convertChromeURL(aURI);
				return resolveURIToLocalPath(resolved);

			case "resource":
				resolved = Cc["@mozilla.org/network/protocol;1?name=resource"].
									 getService(Ci.nsIResProtocolHandler).resolveURI(aURI);
				aURI = Services.io.newURI(resolved, null, null);
				return resolveURIToLocalPath(aURI);

			default:
				return null;
		}
	}

	function getLocalPath(url)
	{
		let uri = null;
		try
		{
			uri = resolveURIToLocalPath(ios.newURI(url, "UTF-8", null));
		}
		catch(e){}
		return uri ? uri.spec.replace(/\\/g, "/") : uri;
	}//getLocalPath()

	function getTab(tab)
	{
		return (new Array(tab + (tab > 0 ? 1 : 0))).join(" ");
	}//tab()

	function fileInit(file, erase)
	{
		erase = typeof(erase) == "undefined" ? true : erase;
		file += ".txt";

		if (!/^file:/.test(file))
			file = "file://" + file;

		let df = dumpFile;
		try
		{
			df = ios.newURI(file, null, null);
			lf.initWithFile(dumpFile.QueryInterface(Ci.nsIFileURL).file);
			if (erase && lf.exists())
				lf.remove(false);
		}
		catch(e)
		{
			df = null;
		}
		dumpFile = df;
	}//fileInit()

	function async(callback, time, timer)
	{
		if (timer)
		{
			timer.timer.cancel();
			timer.unload();
		}
		else
			timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

		if (typeof(unload) == "function")
			clean = unload(timer.cancel);
		else
			clean = function(){};
		timer.init({observe: function()
		{
			callback();
			clean();
		}}, time || 0, timer.TYPE_ONE_SHOT);
		return {timer: timer, unload: clean};
	}//async()

	function saveFile(file, data)
	{
		if (file instanceof Ci.nsIURI)
			files.push({file: file, data: data});
		else if (!files.length)
			return;

		if (!saveFile.working)
		{
			saveFile.working = true;
			let file = files[0].file,
					data = files[0].data;
			async(function()
			{
				let ostream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream),
						converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);

				if (!lf.exists(file.QueryInterface(Ci.nsIFileURL).file))
					lf.create(file.QueryInterface(Ci.nsIFileURL).file, 0644);

				converter.charset = "UTF-8";
				let istream = converter.convertToInputStream(data);

				ostream.init(lf, 0x02|0x08|0x10, 0644, 1);
				Cu.import("resource://gre/modules/NetUtil.jsm");
				NetUtil.asyncCopy(istream, ostream, function(aResult)
				{
					files.splice(0, 1);
					saveFile.working = false;
				});
			}, 0);
		}
		async(saveFile)
	}//saveFile()


	function openConsole()
	{
		AddonManager.getAllAddons(function(addons)
		{
			let win = null;
			function toOpenWindowByType(inType, uri, features)
			{
					let win = Services.wm.getMostRecentWindow(inType),
							ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
				try
				{
					if (win)
						return win;
					else if (features)
						win = ww.openWindow(null, uri, inType, features, null);
					else
						win = ww.openWindow(null, uri, inType, "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar", null);
				}
				catch(e){log.error(e)}

				return win;
			}
			addons.forEach(function(addon)
			{
				if (!addon.isActive || addon.id != "{1280606b-2510-4fe0-97ef-9b5a22eafe80}")
					return;

				try
				{
					win = toOpenWindowByType("global:console", "chrome://console2/content/console2.xul");
				}
				catch(e)
				{
		//			log.error(e)
				}
			})
			if (win)
				return;

			try
			{
				Object.defineProperty(self, "HUDService", {
					get: function HUDService_getter() {
						let devtools = Cu.import("resource://devtools/shared/Loader.jsm", {}).devtools;
						return devtools.require("devtools/client/webconsole/hudservice");
					},
					configurable: true,
					enumerable: true
				});
			}
			catch(e){};
			try
			{
				win = HUDService.getBrowserConsole();
	//				HUDService.openBrowserConsoleOrFocus();
				if (!win)
					win = HUDService.toggleBrowserConsole();
			}
			catch(e)
			{
	//			log.error(e)
			}

			if (win)
				return;

			try
			{
				win = toOpenWindowByType("global:console", "chrome://global/content/console.xul")
			}
			catch(e)
			{
	//			log.error(e)
			}
		});
	}//openConsole()

	const	{classes: Cc, interfaces: Ci, utils: Cu} = Components;
	Cu.import("resource://gre/modules/AddonManager.jsm");
	
	let ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService),
			cr = Cc['@mozilla.org/chrome/chrome-registry;1'].getService(Ci.nsIChromeRegistry),
			ph = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler),
			lf = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile),
			files = [],
			dumpFile = null;


	_func.path = Components.stack.caller.filename.replace(/.* -> |[^\/]+$/g, "");
	_func.dir = getLocalPath(_func.path);
	_func.folder = _func.dir.match(/([^\/]+)\/?$/)[1];
	_func.dir = _func.dir.replace(/[^\/]+\/?$/, "");
	_func.fileInit = fileInit;
	_func.logLevel = 7;
	_func.openConsole = openConsole;
})(__dumpName__); //name of the function

//this[__dumpName__].fileInit("C:/debug/" + this[__dumpName__].folder + "/" + "debug");

//var _dump = this[__dumpName__];