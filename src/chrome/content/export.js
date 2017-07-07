Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
coomanPlus.encryptVersion = 2;
coomanPlus.prefTemplateClipboard = {value: "", extra: false}
coomanPlus.prefTemplateFile = {value: "", extra: false};
coomanPlus.backupTemplate = {value: "{HOST}	{ISDOMAIN_RAW}	{PATH}	{ISSECURE_RAW}	{EXPIRES_RAW}	{NAME}	{CONTENT}", extra: false};
coomanPlus.restoreTemplate = [["host", "string"],["isDomain", "bool"],["path", "string"],["isSecure", "bool"],["expires", "int"],["name", "string"],["value", "string"],["isProtected", "bool"]];
coomanPlus.header = "# HTTP Cookie File Created by Cookies Manager+ v{VERSION} on {DATE}{HEADER}\r\n\r\n";
coomanPlus.restoreStatusCanceled = 0;
coomanPlus.restoreStatusDecrypted = 1;
coomanPlus.restoreStatusEncrypted = 2;
coomanPlus.restoreStatusCorrupted = 3;
RegExp.escape= function(s)
{
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
coomanPlus.exportGetData = function(t, s, a, u, j)
{
	j = typeof(j) == "undefined" ? "\r\n" : j;
	if (typeof(s) == "undefined")
		s = this.getTreeSelections(this._cookiesTree);

	if (!s.length)
		return;

	if (typeof(a) == "undefined")
		a = this._cookies;

	let data = [];
	for(let i = 0; i < s.length; i++)
	{
		if (u)
			data.push(this.exportTemplate(a[s[i]], t).replace(/\ttrue/g, "\tTRUE").replace(/\tfalse/g, "\tFALSE"));
		else
			data.push(this.exportTemplate(a[s[i]], t));
	}
	data.sort();
	return data.join(j);
}

coomanPlus.exportEscape = function(text, urlencode)
{
	if (typeof(urlencode) == "undefined" || urlencode)
	{
		try
		{
			text = encodeURIComponent(text);
		}
		catch(e){}
	}

	return	text.replace(/\n/g, "_CMP_N__CMP__")
							.replace(/\r/g, "_CMP_R__CMP__")
							.replace(/\t/g, "_CMP_T__CMP__")
	
}
coomanPlus.exportUnescape = function(text, urlencode)
{
	if (typeof(urlencode) == "undefined" || urlencode)
	{
		try
		{
			text = decodeURIComponent(text);
		}
		catch(e){}
	}
	return	text.replace(/_CMP_N__CMP__/g, "\n")
							.replace(/_CMP_R__CMP__/g, "\r")
							.replace(/_CMP_T__CMP__/g, "\t")

}

coomanPlus.exportClipboard = function()
{
	let data = this.exportGetData(this.prefTemplateClipboard, undefined, undefined, false, ""),
			str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString),
			trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable),
			clip = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard);
	if (!data)
		return false;

	str.data = data;
	trans.addDataFlavor("text/unicode");
	trans.setTransferData("text/unicode", str, data.length * 2);
	clip.setData(trans, null, Ci.nsIClipboard.kGlobalClipboard);
}

coomanPlus.exportFile = function()
{
	let s = this.getTreeSelections(this._cookiesTree);
	if (!s.length)
		return;

	let bundle = Cc["@mozilla.org/intl/stringbundle;1"]
										.getService(Ci.nsIStringBundleService)
										.createBundle("chrome://pippki/locale/pippki.properties"),
			filename;
	if (s.length > 1)
		filename = this.getFilename("", "cookies_#.txt");
	else
		filename = this._cookies[s[0]].rawHost + "_" + this._cookies[s[0]].name + ".txt";

	let fp = this.saveFileSelect(filename, "txt", "", this.string("exportFileSave"));
	if (!fp)
		return;

	let content = this.exportGetData(this.prefTemplateFile, undefined, undefined, false, "");
	if (!content.length)
		return;

	if (this.saveFile(fp, content))
	{
		if (this.confirm(this.string("export_openfolder"), this.string("export_success")))
			fp.file.reveal();
	}
}

coomanPlus.exportTemplate = function(aCookie, t)
{
	let r = t.value,
			tags = "",
			originAttributes = typeof(aCookie.originAttributes) != "undefined"
													? aCookie.originAttributes
													: aCookie._aCookie && typeof(aCookie._aCookie.originAttributes) != "undefined"
														? aCookie._aCookie.originAttributes 
														: {},

			data = {
				NAME:									this.exportEscape(aCookie.name),
				NAME_RAW:							aCookie.name,
//				CONTENT:							this.exportEscape(aCookie.valueRaw),
//				CONTENT_RAW:					aCookie.valueRaw,
				CONTENT:							this.exportEscape(aCookie.value),
				CONTENT_RAW:					aCookie.value,
				HOST:									this.exportEscape(aCookie.host),
				HOST_RAW:							aCookie.host,
				PATH:									this.exportEscape(aCookie.path, false),
				PATH_RAW:							aCookie.path,
				ISSECURE:							aCookie.isSecure ? this.string("secureYes") : this.string("secureNo"),
				ISSECURE_RAW:					aCookie.isSecure,
				EXPIRES:							this.getExpiresString(aCookie.expires),
				EXPIRES_RAW:					aCookie.expires,
				POLICY:								this.string("policy" + aCookie.policy),
				POLICY_RAW:						aCookie.policy,
				ISDOMAIN:							this.string("yesno"+ (aCookie.isDomain ? 1 : 0)),
				ISDOMAIN_RAW:					aCookie.isDomain,
				TYPE:									this.string("cookieType" + (typeof(aCookie.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookie.type)),
				TYPE_RAW:							aCookie.type,
				ORIGINATTRIBUTES:			JSON.stringify(originAttributes),

				//exceptions
				CAPABILITY:		aCookie.capability,
				EXPIRETIME:		aCookie.expireTime,
				EXPIRETYPE:		aCookie.expireType,
			}

	if ("isProtected" in aCookie && aCookie.isProtected !== null)
	{
		data.ISPROTECTED =			this.string("yesno"+ (aCookie.isProtected ? 1 : 0));
		data.ISPROTECTED_RAW =	aCookie.isProtected;
	}
	if (t.extra)
	{
		data.CREATIONTIME =			this.getExpiresString(Math.round(aCookie.creationTime/1000000));
		data.CREATIONTIME_RAW =	aCookie.creationTime;
		data.LASTACCESSED =			this.getExpiresString(Math.round(aCookie.lastAccessed/1000000));
		data.LASTACCESSED_RAW =	aCookie.lastAccessed;
		data.ISHTTPONLY =				this.string('yesno' + (aCookie.isHttpOnly?1:0));
		data.ISHTTPONLY_RAW =		aCookie.isHttpOnly;
		data.STATUS =						this.string("status" + Math.max(0, aCookie.status));
		data.STATUS_RAW =				aCookie.status;
	}
	for(let i in data)
		tags += "|" + i;

	tags = tags.substr(1);
	r = r.replace(new RegExp("({(" + tags + ")})", "g"), function()
	{
		if (typeof(data[arguments[2]]) !== "undefined")
		{
			return data[arguments[2]];
		}
		return arguments[0];
	});
	return r;
}

coomanPlus.decrypt = function(data, pass, crc, version)
{
	return this.encrypt(data, pass, crc, version);
}

coomanPlus.encrypt = function(data, pass, crc, version)
{
	version = typeof(version) == "undefined" ? this.encryptVersion : version;
	if (version && typeof(coomanPlus["encrypt" + version]) == "function")
	{
		return coomanPlus["encrypt" + version](data, pass, crc, version);
	}
	pass = btoa(pass); //work around some issues when used non-ASCII characters
	let n = 0, r = "";

	for(let i = 0; i < data.length; i++)
	{
		r += String.fromCharCode(data.charCodeAt(i) ^ pass.charCodeAt(n));
		if (++n >= pass.length)
			n = 0;
	}
	if (crc && crc != this.getHash(r))
		return null;

	return r;
}

coomanPlus.backupVisible = function(nsIFile)
{
log.debug();
	let selected = [],
			n = this._cookies.length;
	if (!n)
		return;

	while(n--)
	{
		selected[n] = n;
	}
	this.backupAll([selected, this._cookies], undefined, undefined, undefined, nsIFile);
}

coomanPlus.backupSelected = function(nsIFile)
{
	let s = this.getTreeSelections(this._cookiesTree);
	this.backupAll([s, this._cookies], undefined, undefined, undefined, nsIFile);
}

coomanPlus.backupAll = function(sel, file, templ, header, nsIFile)
{
	let t = new Date(),
			a = this._cookiesAll,
			l = [],
			fp;
	if (typeof(file) == "undefined" && this.pref("backupfilename"))
		file = this.pref("backupfilename");

	file = this.getFilename(sel, file);

	if (typeof(templ) == "undefined")
	{
		templ = this.clone(this.backupTemplate);
		if (this.protect.enabled)
			templ.value += "	{ISPROTECTED_RAW}";
	}
	if (sel)
	{
		l = sel[0];
		a = sel[1];
	}
	else
	{
		for(let i = 0; i < a.length; i++)
			l.push(i);
	}
	let data = this.exportGetData(templ, l, a, true);
	if (!data.length)
		return;

	data = "#template:" + templ.value + "\r\n\r\n\r\n" + data;
//	if (!nsIFile && this.pref("backupencrypt"))
	if (!nsIFile && this.pref("backupencrypt"))
	{
		let password = this.promptPassword(null, null, true);
		if (password)
		{
			data = this.encryptData(password, data);
		}
		else if (password === null)
			return false;
	}

	if (nsIFile)
	{
		nsIFile.append(file);
		fp = {file: nsIFile};
	}
	else
		fp = this.saveFileSelect(file, "txt", "", this.string("exportFileSave"));

	if (!fp)
		return;

	if (this.saveFile(fp, this.exportGetHeader(header) + data))
	{
		if (!nsIFile && this.confirm(this.string("export_openfolder"), this.string("export_success")))
			fp.file.reveal();
	}
}

coomanPlus.encryptData = function(password, data)
{
	let date = this.getHash((new Date()).getTime()),
			md5 = this.getHash(data),
//			e = this.encrypt(md5 + data, password + date),
			e = this.encrypt(md5 + data, password),
			md5e = this.getHash(e);
	return "#encrypted" + md5e + e;
//	return "#encrypted" + md5e + date + e;
}
coomanPlus.exportGetHeader = function(header)
{
	return this.header.replace("{VERSION}",	coomanPlusCore.addon.version)
										.replace("{DATE}",		Date())
										.replace("{HEADER}",	(typeof(header) == "undefined" ? "" : header));
}

coomanPlus.backupAddPassword = function(confirm)
{
	let file = this.restoreOpen(true);
	if (!file)
	{
		return {status: 1, msg: this.string("restore_file_open_error")};
	}
	if (file.encrypted)
	{
		return {status: 2, msg: this.string("backup_already_encrypted")};
	}
	let cookies = file.cookies;
	if (!cookies)
		return {status: 3, msg: this.string("no_cookies_found")};

	let l = [];
	for(let i = 0; i < cookies.length; i++)
		l.push(i);

	let t = this.clone(this.backupTemplate);
	if ("isProtected" in cookies[0] && cookies[0].isProtected !== null)
		t.value += "	{ISPROTECTED_RAW}";

	let data = this.exportGetData(t, l, cookies, true);

	if (!data.length)
		return {status: 4, msg: this.string("no_cookies_found")};

	let password = this.promptPassword(null, null, true, true);
	if (password)
	{
		data = this.encryptData(password, data);
	}
	else
	{
		return {status: 5, msg: this.string("password_notset")};
	}
	let fp = this.saveFileSelect(file.fp.file.leafName, "txt", file.fp.displayDirectory, this.string("exportFileSave"));
	if (!fp)
	{
		return {status: 6, msg: this.string("password_notset")};
	}
	l = /^(#( HTTP Cookie File )?Created by Cookies Manager.*)$/m.exec(file.fileData);
	let h;
	if (l)
		h = l[1] + "\r\n\r\n";
	else
		h = this.exportGetHeader();

	if (confirm && this.saveFile(fp, h + data))
		if (this.confirm(this.string("export_openfolder"), this.string("password_set")))
			fp.file.reveal();

	return {status: 0, msg: "ok", fp: fp}
}

coomanPlus.backupRemovePassword = function()
{
	let file = this.restoreOpen();
	if (file)
	{
		switch(file.status)
		{
			case this.restoreStatusCanceled:
				return;
		}
		if (!file.encrypted)
		{
			this.alert(this.string("backup_notencrypted"))
			return;
		}
	}
	else
		return;

	let cookies = file.cookies;
	if (!cookies)
		return;

	let l = [];
	for(let i = 0; i < cookies.length; i++)
		l.push(i);

	let t = this.clone(this.backupTemplate);
	if ("isProtected" in cookies[0] && cookies[0].isProtected !== null)
		t.value += "	{ISPROTECTED_RAW}";

	let data = this.exportGetData(t, l, cookies, true);

	if (!data.length)
		return;

	let fp = this.saveFileSelect(file.fp.file.leafName, "txt", file.fp.displayDirectory, this.string("exportFileSave"));
	if (!fp)
	{
		this.alert(this.string("backup_decrypt_failed"))
		return;
	}
	let version = new RegExp("^" + RegExp.escape(this.header.substring(0, this.header.indexOf("{DATE}"))).replace("\\{VERSION\\}", "([^\\s]+)"), "m").exec(file.fileData),
			compare = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator).compare,
			pos = -1;
/*
	if (version && compare(version[1], "1.11") >= 0)
	{
		pos = file.fileData.indexOf("#encrypted" + file.encrypted[3] + file.encrypted[2]);
	}
*/
	if (pos == -1)
		pos = file.fileData.indexOf("#encrypted" + file.encrypted[2] + file.encrypted[3]);

	if (pos == -1)
		pos = file.fileData.indexOf(file.encrypted[2] + file.encrypted[3]);

	if (this.saveFile(fp, file.fileData.substring(0, pos) + data))
	{
		if (this.confirm(this.string("export_openfolder"), this.string("backup_decrypt_success")))
			fp.file.reveal();
	}
}

coomanPlus.promptPassword = function(msg, title, newPass, set, file)
{
	let r = {return: null, msg: msg, title: title, newPass: newPass, set: set, file: file};
//	this._openDialog("password.xul", "", "chrome,resizable=no,centerscreen," + (this.isMac ? "dialog=no" : "modal"), r);
	this._openDialog("password.xul", "", "chrome,resizable=no,centerscreen,dialog=no,modal", r);
	return r.return;
}

coomanPlus.restoreVisible = function()
{
	this.restoreAll(this._cookies);
}

coomanPlus.restoreSelected = function()
{
	this.restoreAll(this._selected);
}

coomanPlus.restoreAll = function restoreAll(sel, files)
{
log.debug();
	if (typeof(files) == "undefined")
	{
		files = [];
		let nsIFilePicker = Ci.nsIFilePicker,
				fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

		fp.init(window, this.string("restore_file_open"), nsIFilePicker.modeOpenMultiple);
		fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
		let rv = fp.show();
		if (rv != nsIFilePicker.returnOK)
			return {status: this.restoreStatusCanceled};

		let list = fp.files;
		while(list.hasMoreElements())
		{
			let file = list.getNext().QueryInterface(Components.interfaces.nsILocalFile);
			files.push(file);
		}
	}

	let list = [],
			pass = [],
			self = this;

	for(let i = 0; i < files.length; i++)
	{
		let file = files[i],
				r = self.restoreFile(sel, {
			file: file,
			displayDirectory: file.parent.path
		}, pass);
		if (r && r.restored && r.restored.length)
			list = list.concat(r.restored);

		if (i >= files.length - 1)
		{
			if (!list.length)
			{
				if (files.length > 1 || (files.length == 1 && r.status != self.restoreStatusCorrupted))
					self.alert(coomanPlus.string("restore_none"));

				return;
			}
			for(let i = 0; i < list.length; i++)
			{
				list[i] = self.cookieObjectSave(list[i]);
			}
			self._noObserve = true;
//			self._cookiesTree.view.selection.selectEventsSuppressed = true;
//			self._noselectevent = true;
			self._selected = list;
//			self.selectionSave();
			self.loadCookies(undefined, undefined, undefined, undefined, undefined, true);
//			self.selectLastCookie(true);
			coomanPlus.alert(coomanPlus.string("restore_success").replace("#", list.length));
			self._noObserve = false;
			self._cookiesTree.view.selection.selectEventsSuppressed = false;
			self._noselectevent = false;
		}
	}
}//restoreGetFiles()

coomanPlus.restoreFile = function(sel, fp, pass)
{
	if (sel && sel.length == 0)
	{
		return false;
	}
	let data = this.restoreOpen(undefined, undefined, fp, pass);
	let cookies = data.cookies;
	if (!cookies)
	{
		return data;
	}
	this._noObserve = true;
	let restored = [];
	for(let i = 0; i < cookies.length; i++)
	{
		if (!sel || this._isSelected(cookies[i], sel))
		{
			cookies[i].readonly = coomanPlusCore.readonlyCheck(cookies[i]);
			if (cookies[i].readonly)
			{
				for(let r in cookies[i].readonly)
					cookies[i].readonly[r] = cookies[i][r];
			}
			this.cookieAdd(cookies[i]);
			restored.push(cookies[i]);
		}
	}

	data.restored = restored;
	return data;
}

coomanPlus.restoreOpen = function(nopass, templ, fp, pass)
{
	if (!fp)
	{
		let nsIFilePicker = Ci.nsIFilePicker;
		fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, this.string("restore_file_open"), nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
		let rv = fp.show();
		if (rv != nsIFilePicker.returnOK)
			return {status: this.restoreStatusCanceled};
	}
	let istream = Cc["@mozilla.org/network/file-input-stream;1"].
								createInstance(Ci.nsIFileInputStream);
	istream.init(fp.file, -1, -1, false);

	let bstream = Cc["@mozilla.org/binaryinputstream;1"].
								createInstance(Ci.nsIBinaryInputStream);
	bstream.setInputStream(istream);

	let fileData = bstream.readBytes(bstream.available());
	bstream.close();
	istream.close();
	let data = fileData,
			encrypted = /^(#encrypted)?([0-9a-f]{32})([0-9a-f]{32})?/m.exec(data),
			version = new RegExp("^" + RegExp.escape(this.header.substring(0, this.header.indexOf("{DATE}"))).replace("\\{VERSION\\}", "([^\\s]+)"), "m").exec(data),
			encryptVersion = this.encryptVersion,
			compare = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator).compare,
			salt = "";
	if (version)
	{
		version = version[1];
		if (compare(version, "1.9") < 0)
		{
			encryptVersion = "";
		}
		else if (compare(version, "1.9") >= 0)
		{
			if (encrypted)
			{
				if (1 || compare(version, "1.11") < 0)
				{
					encrypted[3] = encrypted[2];
					encrypted[2] = "";
				}
				else
				{

					let e = encrypted[3];
					encrypted[3] = encrypted[2];
					encrypted[2] = e;
					salt = e;
				}
			}
		}
	}
	if (encrypted)
	{
		if (nopass)
		{
			return {
				status:			this.restoreStatusEncrypted,
				cookies:		null,
				fp:					fp,
				fileData:		fileData,
				encrypted:	encrypted,
				pass:				pass,
				version:		version};
		}
		let str = "#encrypted" + encrypted[2] + encrypted[3],
				pos = data.indexOf(str);

/*
		if (compare(version, "1.11") >= 0)
		{
			str = encrypted[3] + encrypted[2];
			pos = data.indexOf(str);
		}
*/
		if (pos == -1)
		{
			str = encrypted[2] + encrypted[3];
			pos = data.indexOf(str);
		}
		data = data.substring(pos + str.length, data.length);
		if (this.getHash(data) != encrypted[3])
		{
			this.alert(fp.file.path, this.string("backup_corrupted"));
			return {status: this.restoreStatusCorrupted};
		}

		let r = true,
				msg,
				p = 0;
		pass = typeof(pass) == "undefined" ? [] : pass;
		while(1)
		{
			let password,
					prompt = null;

			if (p < pass.length)
			{
				password = pass[p++];
			}
			else
			{
				password = prompt = this.promptPassword(msg, this.string("backup_protected"), undefined, undefined, fp.file.path);
			}
			if (password !== null)
			{
				let d = this.decrypt(data, password + salt, encrypted[2], encryptVersion);
				if (d !== null)
				{
					pass.push(password);
					data = d;
					break;
				}
				if (prompt)
					msg = this.string("password_incorrect");
			}
			else
			{
				return false;
			}
		}
	}
	let lines = data.split("\r\n"),
			cookies = [];

	if (typeof(templ) == "undefined")
		templ = this.restoreTemplate;

	for (let i = 0; i < lines.length; i++)
	{
		let line = lines[i];
		if (line.length > 10 && line.match(/^[^#\s]/))
		{
			let s = line.split("\t"),
					obj = this.objFromArray(s, templ);
			obj.policy = 0;
			let aCookie = new this.cookieObject(obj);

//			aCookie.value = aCookie.valueRaw;
			if (!("isProtected" in obj))
				obj.isProtected = null;

			aCookie.isProtected = obj.isProtected;
			cookies.push(aCookie);
		}
	}
	return {
		status:			this.restoreStatusDecrypted,
		cookies:		cookies,
		fp:					fp,
		fileData:		fileData,
		encrypted:	encrypted,
		pass:				pass,
		version:		version
	};
}

coomanPlus.objFromArray = function(array, templ)
{
	let obj = {};
	for(let i = 0; i < array.length; i++)
	{
		if (i in templ)
		{
			let val = array[i];
			try
			{
				switch(templ[i][1])
				{
					case "int":
						val = parseInt(val);
						break;
					case "bool":
						val = val.toUpperCase() == "TRUE"
						break;
					default:
						val = this.exportUnescape(val);
				}
			}
			catch(e){}
			obj[templ[i][0]] = val;
		}
	}
	return obj;
}

coomanPlus.saveFileSelect = function(filename, ext, dir, title, filter)
{
	let	nsIFilePicker = Ci.nsIFilePicker,
			fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, title, nsIFilePicker.modeSave);
	if (dir)
		fp.displayDirectory = dir;

	fp.defaultString = filename.replace(/\s*/g, '');
	fp.defaultExtension = ext;
	if (filter)
		fp.appendFilter(filter.title, filter.filter);
	else
		fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
	let rv = fp.show();
	if (rv != nsIFilePicker.returnOK && rv != nsIFilePicker.returnReplace)
		return false;

	return fp;
}

coomanPlus.saveFile = function(fp, content)
{
//save file block taken from chrome://pippki/content/pippki.js
	let bundle = Cc["@mozilla.org/intl/stringbundle;1"]
										.getService(Ci.nsIStringBundleService)
										.createBundle("chrome://pippki/locale/pippki.properties"),
			localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
			msg,
			written = 0;

	try
	{
		localFile.initWithPath(fp.file.path);
		if (localFile.exists())
			localFile.remove(true);

		localFile.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);
		let fos = Cc["@mozilla.org/network/file-output-stream;1"].
							createInstance(Ci.nsIFileOutputStream);
		// flags: PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
		fos.init(localFile, 0x04 | 0x08 | 0x20, 0600, 0);
		written = fos.write(content, content.length);
		if (fos instanceof Ci.nsISafeOutputStream)
			fos.finish();
		else
			fos.close();
	}
	catch(e) {
		switch (e.result) {
			case Components.results.NS_ERROR_FILE_ACCESS_DENIED:
				msg = bundle.GetStringFromName("writeFileAccessDenied");
				break;
			case Components.results.NS_ERROR_FILE_IS_LOCKED:
				msg = bundle.GetStringFromName("writeFileIsLocked");
				break;
			case Components.results.NS_ERROR_FILE_NO_DEVICE_SPACE:
			case Components.results.NS_ERROR_FILE_DISK_FULL:
				msg = bundle.GetStringFromName("writeFileNoDeviceSpace");
				break;
			default:
				msg = e.message;
				break;
		}
	}
	if (written != content.length)
	{
		if (!msg.length)
			msg = bundle.GetStringFromName("writeFileUnknownError");

			this.alert(bundle.formatStringFromName("writeFileFailed",[fp.file.path, msg], 2),
									bundle.GetStringFromName("writeFileFailure"));
		return false;
	}
	return true;
}

coomanPlus.getHash = function(str)
{
	let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
			createInstance(Ci.nsIScriptableUnicodeConverter);

	// we use UTF-8 here, you can choose other encodings.
	converter.charset = "UTF-8";
	// result is an out parameter,
	// result.value will contain the array length
	let result = {},
	// data is an array of bytes
			data = converter.convertToByteArray(str, result),
			ch = Cc["@mozilla.org/security/hash;1"]
						.createInstance(Ci.nsICryptoHash);
	ch.init(ch.MD5);
	ch.update(data, data.length);
	let hash = ch.finish(false);
	let h = "";
	for (let i in hash)
		h += ("0" + hash.charCodeAt(i).toString(16)).slice(-2);
	return h;
}

coomanPlus.getFilename = function(sel, file)
{
	let t = new Date(),
			date = t.getFullYear()
							+ coomanPlus.right("00" + (t.getMonth() + 1), 2)
							+ coomanPlus.right("00" + t.getDate(), 2)
							+ coomanPlus.right("00" + t.getHours(), 2)
							+ coomanPlus.right("00" + t.getMinutes(), 2)
							+ coomanPlus.right("00" + t.getSeconds(), 2);
	if (file)
		file = file.replace("#", date);
	else
		file = "backup_cookies_" + (sel ? "" : "all_")
						+ date
						+ ".txt";
	return file;
}
coomanPlus.pass2bytes = function pass2bytes(str)
{
//this function doesn't return 0's hense it doesn't return proper data for non-ASCII characters
	let r = [];
	for (let i = 0; i < str.length; i++)
	{
		let b = str.charCodeAt(i);
		while(b)
		{
			r.push(b & 0xFF);
			b >>= 8;
		}
	}
	return r;
}

coomanPlus.encrypt2 = function(data, pass, crc)
{
	let	base64 = btoa(pass),
			n = 0,
			r = "";
	pass = this.pass2bytes(pass + btoa(base64) + this.getHash(pass) + base64);

	for(let i = 0; i < data.length; i++)
	{
		r += String.fromCharCode(data.charCodeAt(i) ^ pass[n]);
		if (++n == pass.length)
			n = 0;
	}
	if (typeof(crc) != "undefined")
	{
		crc = r.substring(0, 32);
		r = r.substring(32);
	}
	if (crc && crc != this.getHash(r))
		return null;

	return r;
}
