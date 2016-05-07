var log = coomanPlusCore.log,
html5 = {
	cmp: null,
	enabled: false,
	available: false,
//	db: {path: OS.Path.join(OS.Constants.Path.profileDir, "webappsstore.sqlite")},
	db: {path: "webappsstore.sqlite"},
	api: 44, //FF44<
	reverseString: function html5_reverseString(str)
	{
		let r = "";
		for (let i = 0; i < str.length; i++)
		{
			r = str[i] + r;
		}
		return r;
	},
	getCookieObject: function html5_getCookieObject(aScope, aKey, aValue, originKey, originAttributes)
	{
		let scopeArray = aScope.split(":");
		let host	= "";
		let proto = "";
		let port	= "";
		switch (scopeArray.length) {
		case 3:
			port	= scopeArray[2];
			// fall-through
		case 2:
			proto = scopeArray[1];
			// fall-through
		case 1:
			host	= this.reverseString(scopeArray[0]);
		}

		let item = new this.cmp.cookieObject({
			// Properties
			scope				: aScope,
			host				: host,
			rawHost			: this.cmp.getRawHost(host),
			proto				: proto,
			port				: port,
			key					: aKey,
			value				: aValue,
			path				: "",
			isDomain		: false,
			isSecure		: (proto == "https"),
			expires			: -1,
			creationTime: -1,
			expiry			: -1,
			isHttpOnly	: (proto == "http" || proto == "https"),
			isSession		: false,
			lastAccessed: -1,
			isProtected : false,
			name				: aKey,
			policy			: 0,
			type				: coomanPlusCore.COOKIE_HTML5,
			status			: -1,
			originKey		: originKey,
			originAttributes : originAttributes,
			level				: 1,
			parentIndex : -1,
		});
		if (this.cmp.protect.enabled)
			item.isProtected = this.cmp.protect.obj.isProtected(item);

		return item;
	},

	cookieToHTML5: function cookieToHTML5(aCookie)
	{
		let item = this.cmp.clone(aCookie);
		if (!("scope" in item))
			item.scope = this.reverseString(item.host) + ":" + item.proto + ":" + item.port;

		if (!("key" in item))
			item.key = item.name;

		return item;
	},

	get apiSelect ()
	{
		if (this.api == 44)
			return "";
		
		return ",originKey,originAttributes";
	},
	get apiInsert ()
	{
		if (this.api == 44)
			return "";
		
		return ",?,?";
	},

	apiValues: function apiValues(a)
	{
		if (this.api == 44)
			a.splice(3);

		return a;
	},

	cols: [],

	getRow: function getRow(aRow)
	{
		this.__row = aRow;
		for(let i in this.__row)
		{
			if (typeof(this.__row[i]) == "function")
			{
				let a = i;
				this[a] = function(...args)
				{
					try
					{
						return this.__row[a](args);
					}
					catch(e)
					{
//						log(a + "(" + args + ")");
//						log.error(e);
					}
				}
			}
			else
			{
				this[i] = this.__row[i];
			}
		}
	},

	load: function html5_load(callback)
	{
log.debug();
		if (!this.available || !coomanPlusCore.pref("html5"))
		{
			callback([]);
			return;
		}
		let self = this;
		Task.spawn(function html5_load_task()
		{
			let list = [],
					db = null,
					result;

			try
			{
				db = yield Sqlite.openConnection(self.db);
				if (coomanPlusCore.pref("html5all"))
					result = yield db.execute("SELECT scope, key, value" + html5.apiSelect + " FROM webappsstore2 WHERE scope <> 'cmp'");
				else
					result = yield db.execute("SELECT scope, key, value" + html5.apiSelect + " FROM webappsstore2 WHERE scope LIKE ?", ["%:%:%"]);

				for(let aRow of result)
				{
					aRow = new html5.getRow(aRow);
//log(aRow, 2);
					let	scope	= aRow.getResultByName("scope"),
							key		= aRow.getResultByName("key"),
							value	= (aRow.getTypeOfIndex(2) == aRow.VALUE_TYPE_TEXT ? aRow.getResultByName("value") : null);

					if (scope == null || scope.length == 0 || key == null || key.length == 0)
						continue;

					list.push(self.getCookieObject(scope, key, value, aRow.getResultByName("originKey"), aRow.getResultByName("originAttributes")));
				}
			}
			catch(e)
			{
				log.error(e);
			}
			finally
			{
				if (db)
					yield db.close();
			}
			callback(list);
		});
	},
	
	add: function html5_add(aCookie, callback)
	{
		if (!this.available || !coomanPlusCore.pref("html5"))
		{
			callback(false);
			return;
		}

		let self = this;
coomanPlusCore.debug();
		Task.spawn(function html5_add_task()
		{
			let list = [],
					db = null,
					result,
					r = true;

			try
			{
				db = yield Sqlite.openConnection(self.db);
				let item = self.cookieToHTML5(aCookie);
				
/*
				if (!aCookie.aCookie
						|| typeof(aCookie.aCookie.originKey) == "undefined"
						|| aCookie.aCookie.originKey === null)
					item.originKey = typeof(item.originKey) == "undefined" ? item.scope : item.originKey;
				else
					item.originKey = aCookie.aCookie.originKey;
*/
				item.originKey = typeof(item.originKey) == "undefined" ? item.scope : item.originKey;

				if (aCookie.aCookie
						&& typeof(aCookie.aCookie.originAttributes) != "undefined"
						&& aCookie.aCookie.originAttributes !== null)
					item.originAttributes = aCookie.aCookie.originAttributes
				else
					item.originAttributes = typeof(item.originAttributes) == "undefined" ? "" : item.originAttributes;

				yield db.execute("INSERT OR REPLACE INTO webappsstore2 (scope,key,value" + html5.apiSelect + ") VALUES (?,?,?" + html5.apiInsert + ")",
					html5.apiValues([item.scope, item.key, item.value, item.originKey, item.originAttributes]));
			}
			catch(e)
			{
				log.error(e);
				r = false;
			}
			finally
			{
				if (db)
					yield db.close();

				if (typeof(callback) == "function")
					callback(r);
			}
		});
	},//add()

	remove: function html5_remove(aCookie, callback)
	{
		if (!this.available || !coomanPlusCore.pref("html5"))
		{
			callback([]);
			return false;
		}
		let self = this;
coomanPlusCore.debug();
		Task.spawn(function html5_remove_task()
		{
			let list = [],
					db = null,
					result = true;

			try
			{
				db = yield Sqlite.openConnection(self.db);
				item = self.cookieToHTML5(aCookie);
				yield db.execute("DELETE FROM webappsstore2 WHERE scope=? AND key=?", [item.scope, item.name], null);
/*
        // Block the domains if needed
        if (aCookie.block)
        {
          let uri = Services.io.newURI(aCookie.proto + "://" + aCookie.rawHost, null, null);
          CKPermissionsManager.prototype.add(uri, Ci.nsICookiePermission.ACCESS_DENY);
        }
*/
			}
			catch(e)
			{
				log.error(e);
				result = false;
			}
			finally
			{
				if (db)
					yield db.close();
			}
			if (callback)
				callback(result);
		});
	},//remove()

	isExists: function html5_isExists(aCookie, callback)
	{
		if (!this.available || coomanPlusCore.pref("html5"))
		{
			callback(false);
			return false;
		}

		let self = this;
		Task.spawn(function html5_isExists_task()
		{
			let isExists = false,
					db = null,
					result;

			try
			{
				let item = self.cookieToHTML5(aCookie);
				db = yield Sqlite.openConnection(self.db);
				result = yield db.execute("SELECT EXISTS(SELECT value FROM webappsstore2 WHERE scope=? AND key=? AND value=? LIMIT 1) AS isExists", [item.scope, item.key, item.value]);
				isExists = (result[0].getResultByName("isExists"));
/*
				for(let aRow of result)
				{
					let	scope	= aRow.getResultByName("scope"),
							key		= aRow.getResultByName("key"),
							value	= (aRow.getTypeOfIndex(2) == aRow.VALUE_TYPE_TEXT ? aRow.getResultByName("value") : null);

					if (scope == null || scope.length == 0 || key == null || key.length == 0)
						return;

					list.push(self.getCookieObject(scope, key, value, aRow.getResultByName("originKey"), aRow.getResultByName("originAttributes")));
				}
*/
			}
			catch(e)
			{
				log.error(e);
			}
			finally
			{
				if (db)
					yield db.close();
			}
			callback(isExists);
		});
	},
}//html5

try
{
	Components.utils.import("resource://gre/modules/Sqlite.jsm");
	Components.utils.import("resource://gre/modules/osfile.jsm");
	Components.utils.import("resource://gre/modules/Task.jsm");
log.debug("html5.js loaded");
	Task.spawn(function html5_isExists_task()
	{
		let isExists = false,
				db = null,
				result;
		try
		{
			db = yield Sqlite.openConnection(html5.db);
			result = yield db.execute("SELECT sql FROM sqlite_master WHERE tbl_name = 'webappsstore2' AND type = 'table'");
	//CREATE TABLE webappsstore2 (originAttributes TEXT, originKey TEXT, scope TEXT, key TEXT, value TEXT)

			let cols = result[0].getString(0).replace(/[^\(]+\(([^\)]+)\)/g, "$1")
																				.replace(/ [a-zA-Z]+(, ?|$)/g, " ")
																				.replace(/^\s+|\s+$/g, "")
																				.split(" ");

			html5.cols = cols;
			if (cols.indexOf("originKey") != -1 && cols.indexOf("originAttributes") != -1)
				html5.api = 45;//FF45 and newer

			html5.available = true;
		}
		catch(e)
		{
			log.error(e);
		}
		finally
		{
			if (db)
			{
				yield db.close();
			}
		}
	});
}
catch(e)
{
	log.error(e);
}
