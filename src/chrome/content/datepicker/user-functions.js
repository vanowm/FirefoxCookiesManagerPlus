
coomanPlus.spinEvent = function (spinevent, element, spin)
{
//	alert(objSpinButton.id + '\n' + spinevent);

//	var element = objSpinButton.id.replace('-spinButtons','');
	element = element || spinevent.target;
	if (element.getAttribute("disabled") == "true")
		return false;

	element = element.id.replace('-spinButtons','');
	spin = spin || spinevent.target.getAttribute('class');

	let objControl = document.getElementById('ifl_expires_' + element);
	if (objControl.disabled)
		return false;

	if (spin=='up')
	{
		switch(objControl.tagName)
		{
			case "menulist":
				let i = objControl.selectedIndex;
				if (++i >= objControl.itemCount)
					i = 0;

				objControl.selectedIndex = i;
				break;
			default:
				this.changeValue(objControl, parseInt(objControl.value, 10) + 1);
		}
	}

	if (spin=='down')
	{
		switch(objControl.tagName)
		{
			case "menulist":
				let i = objControl.selectedIndex;
				if (--i < 0)
					i = objControl.itemCount - 1;

				objControl.selectedIndex = i;
				break;
			default:
				this.changeValue(objControl, parseInt(objControl.value, 10) - 1);
		}
	}

	this.spinFunc[element](objControl);

	switch (element.toLowerCase())
	{
		case 'day': case 'month': case 'year':
			this.setDateField();
			break;
		case 'hours': case 'minutes': case 'seconds':
			this.setTimeField();
			break;

		default:
			alert("Invalid date type");
	}

//	ChangeSeconds(this);SetTimeField()

}

coomanPlus.calendarSet = function()
{
	document.getElementById( "oe-date-picker-popup" ).setAttribute( "value", (new Date(document.getElementById("ifl_expires_date").value)) );
}

coomanPlus.calendarSave = function(datepopup)
{
	let newDate = datepopup.value,
//	var tempSrc = document.getElementById("start-date-text");
			tempSrc = document.getElementById("ifl_expires_date"),
			getMonth = newDate.getMonth();

	this.changeValue(tempSrc, this.getMonth(getMonth) + ' ' + newDate.getDate() + ", " +  newDate.getFullYear());
	this.fixDate();
	// datepopup.value is a Date object with
	// the year, month, day set to the user selection
}

coomanPlus.changeSeconds = function(objText)
{
	coomanPlus.validateSeconds(objText);

	let v = objText.value;
	if (v.length < 1 )
		v = document.getElementById('ifl_expires_time').value.substring(6,8);

	if (v < 0 || v > 59)
		v = document.getElementById('ifl_expires_time').value.substring(6,8);

	coomanPlus.changeValue(objText, coomanPlus.right('00' + v,2));

}

coomanPlus.validateSeconds = function(objText)
{
	let v = this.numberClean(objText.value);

	if (v.length > 2)
		v = this.left(v,2)

	if (v > 59)
		v = '00';

	if (v < 0)
		v = '59';

	this.changeValue(objText, v);
}

coomanPlus.changeMinutes = function(objText)
{
	coomanPlus.validateMinutes(objText);

	let v = objText.value;
	if (v.length < 1)
		v = document.getElementById('ifl_expires_time').value.substring(3,5);

	if (v < 0 || v > 59)
		v = document.getElementById('ifl_expires_time').value.substring(3,5);

	coomanPlus.changeValue(objText, coomanPlus.right('00' + v,2));

}

coomanPlus.validateMinutes = function(objText)
{
	let v = this.numberClean(objText.value);

	if (v.length > 2)
		v = this.left(v,2)

	if (v > 59)
		v = '00';

	if (v < 0)
		v = '59';

	this.changeValue(objText, v);
}

coomanPlus.changeHours = function(objText)
{
	coomanPlus.validateHours(objText);
	let v = objText.value;
	if (v.length < 1)
		v = document.getElementById('ifl_expires_time').value.substring(0,2);


	if (v < 0 || v > 23)
		v = document.getElementById('ifl_expires_time').value.substring(0,2);

	coomanPlus.changeValue(objText, coomanPlus.right('00' + v,2));

}

coomanPlus.validateHours = function(objText)
{
	let v = this.numberClean(objText.value);

	if (v.length > 2)
		v = this.left(v, 2)

	if (v > 23)
		v = '00';

	if (v < 0)
		v = '23';

	this.changeValue(objText, coomanPlus.right('00' + v));
}

coomanPlus.changeDay = function(objText)
{
	coomanPlus.validateDay(objText);

	let v = objText.value;
	if (v.length == 1)
			v = coomanPlus.right('00' + v,2)

	if (v.length < 1 || v < 1)
	{
		v = (new Date(document.getElementById('ifl_expires_date').value)).getDate();
//		alert("Please enter a valid day");
	}
	coomanPlus.changeValue(objText, coomanPlus.right('00' + v,2));
}

coomanPlus.validateDay = function(objText)
{
	let v = this.numberClean(objText.value),
			year = $('ifl_expires_Year').value,
			month = this.monthToNumber($('ifl_expires_Month').value),
			days = new Array(31, ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

	if (v > days[month])
		v = "01";

	if (v < 1)
		v = days[month];

	this.changeValue(objText, v);
}

coomanPlus.changeMonth = function(objText)
{
	coomanPlus.validateDay(objText);

	let month = coomanPlus.monthToNumber(objText.value);

	if (month < 0)
		month = 0;

	coomanPlus.changeValue(objText, coomanPlus.getMonth(month));
}

coomanPlus.validateMonth = function(objText)
{
	let v = this.numberClean(objText.value),
			year = $('ifl_expires_Year').value,
			month = this.monthToNumber($('ifl_expires_Month').value),
			days = new Array(31, ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

	if (v > days[month])
		v = "01";

	if (v < 1)
		v = days[month];

	this.changeValue(objText, v);
}

coomanPlus.changeYear = function(objText)
{
	coomanPlus.validateYear(objText);
	objText.value = objText.value.substr(objText.value.length - 4);
	if (objText.value.length < 4 || objText.value.length > 4)
	{
		coomanPlus.changeValue(objText, (new Date(document.getElementById('ifl_expires_date').value)).getFullYear());
//		alert("Please enter a sensible valid year");
	}
}

coomanPlus.validateYear = function(objText)
{
	let v = this.numberClean(objText.value),
			min = (new Date().getFullYear()) - 1;

	if (v <= min)
		v = min;

	this.changeValue(objText, ("" + v).substr(v.length-4));
}

coomanPlus.setTimeField = function()
{
	this.changeValue("ifl_expires_time",	this.right('00' + document.getElementById('ifl_expires_Hours').value,2) + ':' +
																				this.right('00' + document.getElementById('ifl_expires_Minutes').value,2) + ':' +
																				this.right('00' + document.getElementById('ifl_expires_Seconds').value,2));
	this.showWarning();
}

coomanPlus.setDateField = function()
{
	
	let t = new Date(	$('ifl_expires_Month').value + ' ' +
										$('ifl_expires_Day').value + ', ' +
										$('ifl_expires_Year').value + ' ' +
										$('ifl_expires_Hours').value + ':' +
										$('ifl_expires_Minutes').value + ':' +
										$('ifl_expires_Seconds').value
	);
	this.changeValue("ifl_expires_date",	this.getMonth(t.getMonth()) + ' ' +
																				this.right("00" + t.getDate(), 2) + ', ' +
																				t.getFullYear());
/*

	if ($('ifl_expires_date').value != $('ifl_expires_Month').value + ' ' +
																										this.right("00" + $('ifl_expires_Day').value,2) + ', ' +
																										$('ifl_expires_Year').value)
	{
//		this.fixDate();
	}
*/

	this.showWarning();
}

coomanPlus.changeValue = function(o, value)
{
	if (typeof(o) == "string")
		o = document.getElementById(o);

	let s = o.selectionStart,
			e = o.selectionEnd;

	o.value = value;
	o.selectionEnd = e;
	o.selectionStart = s;
}

coomanPlus.showWarning = function()
{
	let t = this.getExpireSelection() * 1000,
			d = new Date(t);

	document.getElementById("warning").hidden = !(t && !isNaN(d) && d < (new Date()));
}

coomanPlus.fixDate = function(nofix)
{
	
	let expr_date = this.fixDateTime();
	$("ifl_expires_Month").value	= this.getMonth(expr_date.getMonth());
	this.changeValue("ifl_expires_Day", this.right("00" + expr_date.getDate(), 2))
	this.changeValue("ifl_expires_Year", expr_date.getFullYear());
	this.showWarning();
	if (!nofix)
		this.setDateField();
}

coomanPlus.fixDateTime = function()
{
	
	let expr_date = (new Date($('ifl_expires_date').value + " " + $('ifl_expires_time').value));
	if (isNaN(expr_date))
	{
		if ($('ifl_expires_date').prevDate)
			expr_date = new Date($('ifl_expires_date').prevDate);
		else
			expr_date = $('ifl_expires').value ? new Date($('ifl_expires').value*1000) : this.dateAdd((new Date()), "d", 1);
	}
	$('ifl_expires_date').prevDate = expr_date / 1000;
	return expr_date;
}

coomanPlus.fixTime = function(nofix)
{
	

//	let expr_time = (new Date( 'Thursday, January 01, 1970 ' +$('ifl_expires_time').value));
	let expr_time = this.fixDateTime();

	this.changeValue("ifl_expires_Hours", this.right("00" + expr_time.getHours(), 2));
	this.changeValue("ifl_expires_Minutes", this.right("00" + expr_time.getMinutes(), 2));
	this.changeValue("ifl_expires_Seconds", this.right("00" + expr_time.getSeconds(), 2));
/*
	let expr_time = $('ifl_expires_time').value;

	$('ifl_expires_Hours').value 					= expr_time.substring(0,2);
	$('ifl_expires_Minutes').value 				= expr_time.substring(3,5);
	$('ifl_expires_Seconds').value 				= expr_time.substring(6,8);
*/
	this.showWarning();
	if (!nofix)
		this.setTimeField();
}

coomanPlus.getDay = function(ii)
{
	return ["Sunday", "Monday", "Tuesday", "Wednesday",
					"Thursday", "Friday", "Saturday"][i];
}

//------------------------------------------------------------------
coomanPlus.getMonth = function(i)
{
	return ["January", "February", "March",
					"April", "May", "June",
					"July", "August", "September",
					"October", "November", "December"][i];
}


//------------------------------------------------------------------
coomanPlus.monthToNumber = function(strMonth)
{
	return ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
					.indexOf(strMonth.toLowerCase());
}

coomanPlus.getDateStr = function(datestr)
{
	let dStr = new Date(datestr),
			year = dStr.getYear();

	if(year<1000)
		year+=1900;
	
	return this.getMonth(dStr.getMonth()) + " " + dStr.getDate() + ", " + year;
}

coomanPlus.getTimeStr = function(datestr)
{
	let dStr = new Date(datestr);
	return this.right('00' + dStr.getHours(),2) + ':' + this.right('00' + dStr.getMinutes(),2) + ":" + this.right('00' + dStr.getSeconds(),2);
}


// http://www.flws.com.au/showusyourcode/codeLib/code/js_dateAdd.asp?catID=2
coomanPlus.dateAdd = function(start, interval, number)
{

	// Create 3 error messages, 1 for each argument.
	let startMsg = "Sorry the start parameter of the dateAdd function\n"
			startMsg += "must be a valid date format.\n\n"
			startMsg += "Please try again.",

			intervalMsg = "Sorry the dateAdd function only accepts\n"
			intervalMsg += "d, h, m OR s intervals.\n\n"
			intervalMsg += "Please try again." ,

			numberMsg = "Sorry the number parameter of the dateAdd function\n"
			numberMsg += "must be numeric.\n\n"
			numberMsg += "Please try again." ,

	// get the milliseconds for this Date object.
			buffer = Date.parse( start ) ;

	// check that the start parameter is a valid Date.
	if ( isNaN (buffer) )
	{
		alert( startMsg ) ;
		return null ;
	}

	// check that an interval parameter was not numeric.
	if ( interval.charAt == 'undefined' )
	{
		// the user specified an incorrect interval, handle the error.
		alert( intervalMsg ) ;
		return null ;
	}

	// check that the number parameter is numeric.
	if ( isNaN ( number ) )
	{
		alert( numberMsg ) ;
		return null ;
	}

	// so far, so good...
	//
	// what kind of add to do?
	switch (interval.charAt(0))
	{
		case 'd': case 'D':
				number *= 24 ; // days to hours
				// fall through!
		case 'h': case 'H':
				number *= 60 ; // hours to minutes
				// fall through!
		case 'm': case 'M':
				number *= 60 ; // minutes to seconds
				// fall through!
		case 's': case 'S':
				number *= 1000 ; // seconds to milliseconds
				break ;
		default:
		// If we get to here then the interval parameter
		// didn't meet the d,h,m,s criteria.  Handle
		// the error.
		alert(intervalMsg) ;
		return null ;
	}
	return new Date( buffer + number ) ;
}

coomanPlus.numbersOnly = function(e, ex)
{
	let r = true;
	ex = ex || [];
	for(let i = 0; i < ex.length; i++)
	{
		if (e.keyCode == ex[i][0])
		{
			if (ex[i][1] && !e.shiftKey)
				r = false;

			return r;
		}
	}

	if (e.keyCode == KeyEvent.DOM_VK_RETURN)
	{
		let f = e.target.id.replace("ifl_expires_", "");
		if (coomanPlus.spinFunc[f])
		{
			coomanPlus.spinFunc[f](e.target);
			coomanPlus.setTimeField();
		}
	}
	let start = e.target.selectionStart,
			end = e.target.selectionEnd,
			m = e.target.value.substring(start, end).match(/:/);

	if (e.keyCode == 8 || e.keyCode == 46) //backspace, delete
	{
		if (start == end)
		{
			if (e.keyCode == 8)
				start--;
			else
				end++;
		}
		if (e.target.value.substring(start, end).match(/:/))
			return false;
	}
	if ((e.keyCode > 57 && e.keyCode < 96) || e.keyCode > 105)
		r = false;
	else if (m && ((e.keyCode > 47 && e.keyCode < 58) || (e.keyCode > 95 && e.keyCode < 106)))
		r = false;

	if (e.keyCode == 38)
	{
		let s = e.target.parentNode.getElementsByTagName("spinbuttonsH");
		if (!s.length)
			s = e.target.parentNode.getElementsByTagName("spinbuttonsV");

		if (s.length)
			this.spinEvent("", s[0], "up");
	}
	else if (e.keyCode == 40)
	{
		let s = e.target.parentNode.getElementsByTagName("spinbuttonsH");
		if (!s.length)
			s = e.target.parentNode.getElementsByTagName("spinbuttonsV");

		if (s.length)
			this.spinEvent("", s[0], "down");
	}
	return r;
}


coomanPlus.spinFunc = {
	Year: coomanPlus.changeYear,
	Month: coomanPlus.changeMonth,
	Day: coomanPlus.changeDay,
	Hours: coomanPlus.changeHours,
	Minutes: coomanPlus.changeMinutes,
	Seconds: coomanPlus.changeSeconds
};

