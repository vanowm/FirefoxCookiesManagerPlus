function oeDatePicker()
 {

 }

/**
*   Static variables
*/


/** The popup window containing the picker */
 oeDatePicker.gPopup  = null;


/** The original starting date and currently selected date */
 oeDatePicker.gOriginalDate = null;
 oeDatePicker.gSelectedDate = null;

 /* selected items */
 oeDatePicker.gSelectedMonthItem = null;
 oeDatePicker.gSelectedDayItem = null;



/**
*   Set up the picker, called when the popup pops
*/

oeDatePicker.onpopupshowing = function( popup )
{
	if (popup.getAttribute("disabled") == "true")
		return false;
	// remember the popup item so we can close it when we are done

	oeDatePicker.gPopup = popup;

	// get the start date from the popup value attribute and select it

	var startDate = popup.getAttribute( "value" );

	oeDatePicker.gOriginalDate = new Date( startDate );
	oeDatePicker.gSelectedDate = new Date( startDate );

	// draw the year based on the selected date

	oeDatePicker.redrawYear();

	// draw the month based on the selected date

	var month = oeDatePicker.gSelectedDate.getMonth() + 1;
	var selectedMonthBoxItem = $( "oe-date-picker-year-month-" + month + "-box"  );


	oeDatePicker.selectMonthItem( selectedMonthBoxItem );

	// draw in the days for the selected date

	oeDatePicker.redrawDays();
}


/**
*   Called when a day is clicked, close the picker and call the client's oncommand
*/


oeDatePicker.clickDay = function oeDatePicker_clickDay( newDayItemNumber )
{
	// get the clicked day

	var dayNumberItem = $( "oe-date-picker-month-day-text-" + newDayItemNumber );
	if (dayNumberItem.disabled)
		return false;

	var dayNumber = dayNumberItem.getAttribute( "value" );

	$("oe-date-picker-year-title-text").value = Number($("oe-date-picker-year-title-text").value) + dayNumberItem.year;
//	oeDatePicker.gSelectedDate.setFullYear( dayNumberItem.year );

	oeDatePicker.clickMonth($("oe-date-picker-year-month-" + (dayNumberItem.month + 1) + "-box"), dayNumberItem.month + 1);

	// set the selected date to what they cliked on

	oeDatePicker.gSelectedDate.setDate( dayNumber );
	oeDatePicker.selectYear();

	oeDatePicker.gPopup.hidePopup();
}


oeDatePicker.selectDate = function()
{
	// We copy the picked date to avoid problems with changing the Date object in place

	var pickedDate = new Date( oeDatePicker.gSelectedDate );

	// put the selected date in the popup item's value property

	oeDatePicker.gPopup.value = pickedDate;

	// get the client oncommand function, call it if there is one

	var commandEventMethod = oeDatePicker.gPopup.getAttribute( "oncommand" );

	if( commandEventMethod != null )
	{
			// set up a variable date, that will be avaialable from within the
			// client method

			var date = pickedDate;

			// Make the function a member of the popup before calling it so that
			// 'this' will be the popup

			oeDatePicker.gPopup.oeDatePickerFunction =  function() {coomanPlus.calendarSave(oeDatePicker.gPopup);};

			oeDatePicker.gPopup.oeDatePickerFunction();
	}

	// close the popup

	//oeDatePicker.gPopup.closePopup ();

}


/**
* Called when a month box is clicked
*/

oeDatePicker.clickMonth = function oeDatePicker_clickMonth( newMonthItem, newMonthNumber )
{
	// already selected, return
log.debug();
	if( oeDatePicker.gSelectedMonthItem  == newMonthItem )
	{
			return;
	}

	// Avoid problems when changing months if the date is at the end of the month
	// i.e. if date is 31 march and you do a setmonth to april, the month would
	// actually be set to may, beacause april only has 30 days.
	// This is why we keep the original date around.

	var oldDate = oeDatePicker.gSelectedDate.getDate();
	var yearNumber = oeDatePicker.gSelectedDate.getFullYear();

	var lastDayOfMonth = DateUtils.getLastDayOfMonth( yearNumber, newMonthNumber-1 );

	if ( oldDate > lastDayOfMonth )
	{
			oeDatePicker.gSelectedDate.setDate(lastDayOfMonth);
	}

	// update the selected date

	oeDatePicker.gSelectedDate.setMonth( newMonthNumber - 1 );

	// select Month

	oeDatePicker.selectMonthItem( newMonthItem );

	// redraw days

	oeDatePicker.redrawDays();

	oeDatePicker.selectDate();
}


/**
* Called when previous Year button is clicked
*/

oeDatePicker.previousYearCommand = function()
{
	// update the selected date

	var min = (new Date().getFullYear());
	var oldYear = oeDatePicker.gSelectedDate.getFullYear();
	if (oldYear <= min)
		return;
	oeDatePicker.gSelectedDate.setFullYear( oldYear - 1 );

	// redraw the year and the days

	oeDatePicker.redrawYear();
	oeDatePicker.redrawDays();

	oeDatePicker.selectDate();
}


/**
* Called when next Year button is clicked
*/

oeDatePicker.nextYearCommand = function()
{
	// update the selected date

	var oldYear = oeDatePicker.gSelectedDate.getFullYear();
	oeDatePicker.gSelectedDate.setFullYear( oldYear + 1 );

	// redraw the year and the days

	oeDatePicker.redrawYear();
	oeDatePicker.redrawDays();

	oeDatePicker.selectDate();
}


/**
* Draw the year based in the selected date
*/

oeDatePicker.redrawYear = function()
{
	var yearTitleItem = $( "oe-date-picker-year-title-text" );
	var year = oeDatePicker.gSelectedDate.getFullYear();
	yearTitleItem.setAttribute( "value", year );
	yearTitleItem.value = year;
	var today = new Date();
	$( "oe-date-picker-year-month-" + (today.getMonth()+1) + "-box"  ).setAttribute("today", (today.getFullYear() == oeDatePicker.gSelectedDate.getFullYear()))
}


/**
* Select a month box
*/

oeDatePicker.selectMonthItem = function( newMonthItem )
{
	// clear old selection, if there is one


	if( oeDatePicker.gSelectedMonthItem != null )
	{
			oeDatePicker.gSelectedMonthItem.setAttribute( "selected" , false );
	}

	// Set the selected attribute, used to give it a different style

	newMonthItem.setAttribute( "selected" , true );

	// Remember new selection

	oeDatePicker.gSelectedMonthItem = newMonthItem;

}


/**
* Select a day box
*/

oeDatePicker.selectDayItem = function( newDayItem )
{
	// clear old selection, if there is one

	if( oeDatePicker.gSelectedDayItem != null )
	{
			oeDatePicker.gSelectedDayItem.setAttribute( "selected" , false );
	}

	if( newDayItem != null )
	{
			// Set the selected attribute, used to give it a different style

			newDayItem.setAttribute( "selected" , true );
	}

	// Remember new selection

	oeDatePicker.gSelectedDayItem = newDayItem;

}


/**
* Redraw day numbers based on the selected date
*/

oeDatePicker.redrawDays = function( )
{
	// Write in all the day numbers

	let month = oeDatePicker.gSelectedDate.getMonth(),
			monthNew = month,
			year = oeDatePicker.gSelectedDate.getFullYear(),
			yearNew = 0;

	var firstDate = new Date( year, month, 1 );
	var firstDayOfWeek = firstDate.getDay();

	var lastDayOfMonth = DateUtils.getLastDayOfMonth( year, month )
	var lastDayOfPrevMonth = DateUtils.getLastDayOfMonth( year - (month == 1 ? 1 : 0), month-1 )

	// clear the selected day item
	var today = new Date(),
			todayYear = today.getFullYear();
	today = (todayYear == year && today.getMonth() == month) ? today.getDate() : null;
	oeDatePicker.selectDayItem( null );

	// redraw each day bax in the 7 x 6 grid

	var dayNumber = 1;
	var dayNumberPrevMonth = lastDayOfPrevMonth - firstDayOfWeek
	let value, disabled, outside;
	for( var dayIndex = 0; dayIndex < 42; ++dayIndex )
	{
		// get the day text box

		var dayNumberItem = $( "oe-date-picker-month-day-text-" + (dayIndex + 1) );

		// if it is an unfilled day ( before first or after last ), just set its value to "",
		// and don't increment the day number.

		disabled = false;
		if( dayIndex < firstDayOfWeek)
		{
			dayNumberPrevMonth++;
			value = dayNumberPrevMonth;
			outside = true;
			if (month < 1)
			{
				monthNew = 11;
				yearNew =  -1;
				if (year <= todayYear)
				{
					disabled = true;
				}
			}
			else
				monthNew = month - 1

		}
		else if(dayNumber > lastDayOfMonth)
		{
			value = (dayNumber - lastDayOfMonth);
			outside = true;
			++dayNumber;
			if (month > 10)
			{
				monthNew = 0;
				yearNew = +1;
			}
			else
				monthNew = month + 1;
		}
		else
		{
			// set the value to the day number

			value = dayNumber;
			outside = false;
			monthNew = month;
			yearNew = 0;
			// draw the day as selected
			if( dayNumber == oeDatePicker.gSelectedDate.getDate() )
			{
					var dayNumberBoxItem = $( "oe-date-picker-month-day-" + (dayIndex + 1) + "-box"  );
					oeDatePicker.selectDayItem( dayNumberBoxItem );
			}
			$( "oe-date-picker-month-day-" + (dayIndex + 1) + "-box"  ).setAttribute("today", (dayNumber == today));
			// advance the day number

			++dayNumber;
		}
		dayNumberItem.setAttribute( "value" , value );
		dayNumberItem.month = monthNew;
		dayNumberItem.year = yearNew;
		dayNumberItem.disabled = disabled;
		dayNumberItem.parentNode.setAttribute( "disabled" , disabled);
		dayNumberItem.setAttribute( "outside", outside);
		dayNumberItem.parentNode.setAttribute( "outside" , outside);
	}

}
oeDatePicker.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

oeDatePicker.selectYear = function oeDatePicker_selectYear()
{
//	oeDatePicker.timer.cancel();

	if (!coomanPlus)
		return;

	let obj = $("oe-date-picker-year-title-text");

	coomanPlus.changeYear(obj);

	let y = oeDatePicker.gSelectedDate.getFullYear(),
			thisYear = (new Date()).getFullYear();

	oeDatePicker.gSelectedDate.setFullYear( obj.value );
	if (isNaN(oeDatePicker.gSelectedDate))
		oeDatePicker.gSelectedDate.setFullYear( y );

	if (oeDatePicker.gSelectedDate.getFullYear() < thisYear)
		oeDatePicker.gSelectedDate.setFullYear(thisYear);

	oeDatePicker.redrawYear();
	oeDatePicker.redrawDays();
	oeDatePicker.selectDate();
}
oeDatePicker.selectYearDelayed = function(t)
{
	oeDatePicker.timer = coomanPlusCore.async(oeDatePicker.selectYear, 2000, oeDatePicker.timer);
}

oeDatePicker.checkYear = function(e)
{
	if (e.keyCode == KeyEvent.DOM_VK_RETURN)
		oeDatePicker.selectYear()

	return coomanPlus.numbersOnly(e);
}