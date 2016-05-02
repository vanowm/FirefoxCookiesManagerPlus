Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");
coomanPlus.prefTemplateClipboard = {value: "", extra: false}
coomanPlus.prefTemplateFile = {value: "", extra: false};
coomanPlus.prefBackupEncrypt = false;
coomanPlus.backupTemplate = {value: "{HOST}	{ISDOMAIN_RAW}	{PATH}	{ISSECURE_RAW}	{EXPIRES_RAW}	{NAME}	{CONTENT_RAW}		{TYPE_RAW}", extra: false};
coomanPlus.restoreTemplate = [["host", "string"],["isDomain", "bool"],["path", "string"],["isSecure", "bool"],["expires", "int"],["name", "string"],["value", "string"],["isProtected", "bool"],["type", "int"]];
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
	for(var i = 0; i < s.length; i++)
	{
		if (u)
			data[data.length] = this.exportTemplate(a[s[i]], t).replace(/\ttrue/g, "\tTRUE").replace(/\tfalse/g, "\tFALSE");
		else
			data[data.length]= this.exportTemplate(a[s[i]], t);
	}
	data.sort();
	return data.join(j);
}

coomanPlus.exportClipboard = function()
{
	let data = this.exportGetData(this.prefTemplateClipboard, undefined, undefined, false, ""),
			str = Cc["@mozilla.org/supports-string;1"]
						.createInstance(Ci.nsISupportsString),
			trans = Cc["@mozilla.org/widget/transferable;1"]
							.createInstance(Ci.nsITransferable),
			clip = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard);
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

	let bundle = srGetStrBundle("chrome://pippki/locale/pippki.properties"),
			filename;
	if (s.length > 1)
	{
		let t = new Date();
		filename = "cookies_"
							+ t.getFullYear()
							+ coomanPlus.right("00" + t.getMonth(), 2)
							+ coomanPlus.right("00" + t.getDate(), 2)
							+ coomanPlus.right("00" + t.getHours(), 2)
							+ coomanPlus.right("00" + t.getMinutes(), 2)
							+ coomanPlus.right("00" + t.getSeconds(), 2)
							+ ".txt";
	}
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
			data = {
				NAME:					aCookie.name,
				CONTENT:			aCookie.value,
				CONTENT_RAW:	aCookie.value,
				HOST:					aCookie.host,
				PATH:					aCookie.path,
				ISSECURE:			aCookie.isSecure ? this.string("secureYes") : this.string("secureNo"),
				ISSECURE_RAW:	aCookie.isSecure,
				EXPIRES:			this.getExpiresString(aCookie.expires),
				EXPIRES_RAW:	aCookie.expires,
				POLICY:				this.string("policy"+aCookie.policy),
				POLICY_RAW:		aCookie.policy,
				ISDOMAIN:			this.string("yesno"+ (aCookie.isDomain ? 1 : 0)),
				ISDOMAIN_RAW:	aCookie.isDomain,
				TYPE:				this.string("cookieType" + (typeof(aCookie.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookie.type)),
				TYPE_RAW:		aCookie.type,
		
				//exceptions
				CAPABILITY:		aCookie.capability,
				EXPIRETIME:		aCookie.expireTime,
				EXPIRETYPE:		aCookie.expireType,
			}
	if (this.protect.enabled)
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

coomanPlus.decrypt = function(data, pass, crc)
{
	return this.encrypt(data, pass, crc);
}

coomanPlus.encrypt = function(data, pass, crc)
{
	


































/*
//converted encrypt to async
//decrypt is next
//	let p = this.getHash256(pass);
	let scriptloader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
	scriptloader.loadSubScript(coomanPlus.app.getResourceURI("chrome/content/cryptico.js").spec);
_bench()
	let RSAKey = cryptico.generateRSAKey(pass, 1024),
			re,
			r;
_bench("RSA");
	let p = {return: null, title: "encrypt for now"};
	coomanPlus.async(function()
	{
		coomanPlus._openDialog("de-en-crypt_progress.xul", "", "chrome,resizable=no,centerscreen," + (coomanPlus.isMac ? "dialog=no" : "modal"), p);
	});
	if (crc)
	{
		re = cryptico.decrypt(data, RSAKey)
		r = re.plaintext || null;
	}
	else
	{
		re = cryptico.encrypt(data, cryptico.publicKeyString(RSAKey), null, function(d)
		{
_bench("callback");
			log(d.status, 1);
//			log(cryptico.decrypt(d.cipher, RSAKey), 1);
		});
//		r = re.cipher;
	}
	return r
*/
	pass = Base64.encode(pass); //work around some issues when used non-ASCII characters
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

coomanPlus.backupSelected = function()
{
	let l = [],
			s = this.getTreeSelections(this._cookiesTree);
	this.backupAll([s, this._cookies]);
}


coomanPlus.backupAll = function(sel, file, templ, header)
{
	let t = new Date(),
			a = this._cookiesAll,
			l = [];
	if (typeof(file) == "undefined" && this.pref("backupfilename"))
		file = this.pref("backupfilename");

	file = this.getFilename(sel, file);
	if (typeof(templ) == "undefined")
	{
		templ = this.clone(this.backupTemplate);
		if (this.protect.enabled)
			templ.value = templ.value.replace("\t\t", "	{ISPROTECTED_RAW}	");
	}
	if (sel)
	{
		l = sel[0];
		a = sel[1];
	}
	else
	{
		for(let i = 0; i < this._cookiesAll.length; i++)
			l.push(i);
	}

	let data = this.exportGetData(templ, l, a, true);

	if (!data.length)
		return;

	data = "#template:" + templ.value + "\r\n\r\n\r\n" + data;
	if (this.prefBackupEncrypt)
	{
		var password = this.promptPassword(null, null, true);
		if (password)
		{
			data = this.encryptData(password, data);
		}
		else if (password === null)
			return false;
	}

	let fp = this.saveFileSelect(file, "txt", "", this.string("exportFileSave"));
	if (!fp)
		return;

	if (this.saveFile(fp, this.exportGetHeader(header) + data))
	{
		if (this.confirm(this.string("export_openfolder"), this.string("export_success")))
			fp.file.reveal();
	}
}

coomanPlus.encryptData = function(password, data)
{
	let md5 = this.getHash(data),
			e = this.encrypt(data, password),
			md5e = this.getHash(e);
	return "#encrypted" + md5 + md5e + e;
}

coomanPlus.exportGetHeader = function(header)
{
	return "#Created by Cookies Manager+ v" + coomanPlusCore.addon.version + " on " + Date() + (typeof(header) == "undefined" ? "" : header) + "\r\n\r\n";
}

coomanPlus.backupAddPassword = function()
{
	let file = this.restoreOpen(true);
	if (!file)
	{
		this.alert(this.string("restore_file_open_error"));
		return;
	}
	if (file[4])
	{
		this.alert(this.string("backup_already_encrypted"));
		return;
	}
	let b = this.prefBackupEncrypt,
			cookies = file[1];
	this.prefBackupEncrypt = true;
	if (!cookies)
		return;

	let l = [];
	for(let i = 0; i < cookies.length; i++)
		l.push(i);

	let t = this.clone(this.backupTemplate);
	if ("isProtected" in cookies[0])
		t.value = t.value.replace("\t\t", "	{ISPROTECTED_RAW}	");

	let data = this.exportGetData(t, l, cookies, true);

	if (!data.length)
		return;

	let password = this.promptPassword(null, null, true, true);
//	if (password === null)
//		return;

	if (password)
	{
		data = this.encryptData(password, data);
	}
	else
	{
		this.alert(this.string("password_notset"));
		return;
	}
	let fp = this.saveFileSelect(file[2].file.leafName, "txt", file[2].displayDirectory, this.string("exportFileSave"));
	if (!fp)
	{
		this.alert(this.string("password_notset"))
		return;
	}
	l = /^(#Created by Cookies Manager.*)$/m.exec(file[3]);
	let h;
	if (l)
		h = l[1] + "\r\n\r\n";
	else
		h = this.exportGetHeader();

	if (this.saveFile(fp, h + data))
		if (this.confirm(this.string("export_openfolder"), this.string("password_set")))
			fp.file.reveal();
}

coomanPlus.backupRemovePassword = function()
{
	let file = this.restoreOpen();
	if (file)
	{
		switch(file[0])
		{
			case "canceled":
				return;
		}
		if (!file[4])
		{
			this.alert(this.string("backup_notencrypted"))
			return;
		}
	}
	else
		return;

	let cookies = file[1];
	if (!cookies)
		return;

	let l = [];
	for(let i = 0; i < cookies.length; i++)
		l.push(i);

	let t = this.clone(this.backupTemplate);
	if ("isProtected" in cookies[0])
		t.value = t.value.replace("\t\t", "	{ISPROTECTED_RAW}	");

	let data = this.exportGetData(t, l, cookies, true);

	if (!data.length)
		return;

	let fp = this.saveFileSelect(file[2].file.leafName, "txt", file[2].displayDirectory, this.string("exportFileSave"));
	if (!fp)
	{
		this.alert(this.string("backup_decrypt_failed"))
		return;
	}
	let pos = file[3].indexOf("#encrypted" + file[4][2] + file[4][3]);
	if (pos == -1)
		pos = file[3].indexOf(file[4][2] + file[4][3]);

	if (this.saveFile(fp, file[3].substring(0, pos) + data))
	{
		if (this.confirm(this.string("export_openfolder"), this.string("backup_decrypt_success")))
			fp.file.reveal();
	}
}

coomanPlus.promptPassword = function(msg, title, newPass, set, file)
{
	let r = {return: null, msg: msg, title: title, newPass: newPass, set: set, file: file};
	this._openDialog("password.xul", "", "chrome,resizable=no,centerscreen," + (this.isMac ? "dialog=no" : "modal"), r);
	return r.return;
}

coomanPlus.restoreSelected = function()
{
	this.restoreAll(true);
}

coomanPlus.restoreAll = function(sel, fp, callback)
{
	if (sel && this._selected.length == 0)
	{
		if (typeof(callback) == "function")
			callback(false);

		return;
	}

	let cookies = this.restoreOpen(undefined, undefined, fp)[1];
	if (!cookies)
	{
		if (typeof(callback) == "function")
			callback(false);

		return;
	}

	this._noObserve = true;
	let num = 0,
			added = 0,
			restored = [],
			list = [],
			self = this;

	for(let i = 0; i < cookies.length; i++)
	{
		if (!sel || self._isSelected(cookies[i]))
		{
			added++;
			self.cookieAdd(cookies[i], function(result)
			{
				working = false;
				restored.push([cookies[i], result]);
			});
			num++;
		}
	}
	(function loop()
	{
		if (added == restored.length)
		{
			restoreAllContinue();
			return;
		}

		coomanPlusCore.async(loop);
	})()
	function restoreAllContinue()
	{
		if (restored.length > 0)
		{
			for(let i = 0; i < restored.length; i++)
				list.push({
					h: self.cookieHash({
						host: restored[i][0].host,
						name: restored[i][0].name,
						path: restored[i][0].path,
						type: restored[i][0].type,
						value: restored[i][0].type == coomanPlusCore.COOKIE_NORMAL ? "" : restored[i][0].value
					})
				});
		}
		if (!fp && list.length)
		{
			self.selectionSave(list);
			self.loadCookies();
		}
	//	self.selectLastCookie(false);
	/*
		let s = self.getTreeSelections(self._cookiesTree);
		if (s.length)
		{
			self._currentIndexObj = null;
			self._currentIndex = s[0];
			self._cookiesTree.view.selection.currentIndex = s[0];
			self._cookiesTree.treeBoxObject.ensureRowIsVisible(s[0]);
		}
		else
		{
			self._cookiesTree.view.selection.currentIndex = self._currentIndex;
		}
	*/
		if (fp)
		{
			callback([restored, list]);
			return;
		}

		if (num > 0)
			self.alert(self.string("restore_success").replace("#", num));
		else
			self.alert(self.string("restore_none"));

		if (typeof(callback) == "function")
			callback([restored, list]);
	}
}

coomanPlus.restoreOpen = function(nopass, templ, fp)
{
	if (!fp)
	{
		let nsIFilePicker = Ci.nsIFilePicker;
		fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, this.strings["restore_file_open"], nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
		let rv = fp.show();
		if (rv != nsIFilePicker.returnOK)
			return ["canceled"];
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
			encrypted = /^(#encrypted)?([0-9a-f]{32})([0-9a-f]{32})/m.exec(data);

	if (encrypted)
	{
		if (nopass)
		{
			return ["encrypted", null, fp, fileData, encrypted];
		}
		let str = "#encrypted" + encrypted[2] + encrypted[3],
				pos = data.indexOf(str);

		if (pos == -1)
		{
			str = encrypted[2] + encrypted[3];
			pos = data.indexOf(str);
		}
		data = data.substring(pos + str.length, data.length);
		if (this.getHash(data) != encrypted[3])
		{
			this.alert(this.strings.backup_corrupted);
			return false;
		}

		let r = true, msg;
		while(1)
		{
			let password = this.promptPassword(msg, this.string("backup_protected"), undefined, undefined, fp.file.path);
			if (password !== null)
			{
				let d = this.decrypt(data, password, encrypted[2]);
				if (d !== null)
				{
					data = d;
					break;
				}
				msg = this.string("password_incorrect");
//					this.alert(this.string("password_incorrect"));
			}
			else
			{
				return false;
			}
		}
	}
	let lines = data.split("\r\n"),
			cookies = [];
	data = "";
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

			if (!("isProtected" in obj))
				obj.isProtected = null;

			aCookie.isProtected = obj.isProtected;
			cookies.push(aCookie);
		}
	}

	return [false, cookies, fp, fileData, encrypted];
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
				}
			}
			catch(e){}
			obj[templ[i][0]] = val;
		}
	}
	return obj;
}

coomanPlus.saveFileSelect = function(filename, ext, dir, title)
{
log(dir, 1);
	let	nsIFilePicker = Ci.nsIFilePicker,
			fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, title, nsIFilePicker.modeSave);
	if (dir)
		fp.displayDirectory = dir;

	fp.defaultString = filename.replace(/\s*/g, '');
	fp.defaultExtension = ext;
	fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
	let rv = fp.show();
	if (rv != nsIFilePicker.returnOK && rv != nsIFilePicker.returnReplace)
		return false;

	return fp;
}

coomanPlus.saveFile = function(fp, content)
{
//save file block taken from chrome://pippki/content/pippki.js
	let	bundle = srGetStrBundle("chrome://pippki/locale/pippki.properties"),
			localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
			msg,
			written = 0;

	try
	{
		localFile.initWithPath(fp.file.path);
		if (localFile.exists())
			localFile.remove(true);

		localFile.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);
		let fos = Cc["@mozilla.org/network/file-output-stream;1"]
							.createInstance(Ci.nsIFileOutputStream);
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
	let result = {};
	// data is an array of bytes
	let data = converter.convertToByteArray(str, result),
			ch = Cc["@mozilla.org/security/hash;1"]
						.createInstance(Ci.nsICryptoHash);
	ch.init(ch.MD5);
	ch.update(data, data.length);
	let hash = ch.finish(false);
	// return the two-digit hexadecimal code for a byte
	function toHexString(charCode)
	{
		return ("0" + charCode.toString(16)).slice(-2);
	}
	// convert the binary hash data to a hex string.
	let h = [];
	for (let i in hash)
	{
		h.push(toHexString(hash.charCodeAt(i)));
	}
	return h.splice(0,16).join("");
}

coomanPlus.getFilename = function(sel, file)
{
	var file, t = new Date();
	var date = t.getFullYear()
							+ coomanPlus.right("00" + t.getMonth(), 2)
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

/*
coomanPlus.getHash256 = function(str)
{
	let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
			createInstance(Ci.nsIScriptableUnicodeConverter);

	// we use UTF-8 here, you can choose other encodings.
	converter.charset = "UTF-8";
	// result is an out parameter,
	// result.value will contain the array length
	let result = {};
	// data is an array of bytes
	let data = converter.convertToByteArray(str, result),
			ch = Cc["@mozilla.org/security/hash;1"]
						.createInstance(Ci.nsICryptoHash);
	ch.init(ch.SHA256);
	ch.update(data, data.length);
	let hash = ch.finish(false);
	// return the two-digit hexadecimal code for a byte
	function toHexString(charCode)
	{
		return ("0" + charCode.toString(16)).slice(-2);
	}
	// convert the binary hash data to a hex string.
	let h = [];
	for (let i in hash)
	{
		h.push(toHexString(hash.charCodeAt(i)));
	}
	return h.splice(0,16).join("");
}
*/
