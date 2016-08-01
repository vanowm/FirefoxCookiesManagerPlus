const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");
var log = coomanPlusCore.log;

const CLASS_ID = Components.ID('bb6bc1bb-f824-4702-90cd-35e2fb24f25d'); // ? Change this
const CLASS_NAME = "CookiesManager+ AutoComplete";
const CONTRACT_ID = '@mozilla.org/autocomplete/search;1?name=cmp-autocomplete';

/**
 * @constructor
 *
 * @implements {nsIAutoCompleteResult}
 *
 * @param {string} searchString
 * @param {number} searchResult
 * @param {number} defaultIndex
 * @param {string} errorDescription
 * @param {Array.<string>} results
 */
function ProviderAutoCompleteResult(searchString, searchResult,
  defaultIndex, errorDescription, results) {
  this._searchString = searchString;
  this._searchResult = searchResult;
  this._defaultIndex = defaultIndex;
  this._errorDescription = errorDescription;
  this._results = results;
}
ProviderAutoCompleteResult.list = [];
ProviderAutoCompleteResult.prototype = {
  _searchString: "",
  _searchResult: 0,
  _defaultIndex: 0,
  _errorDescription: "",
  _results: [],

  /**
   * @return {string} the original search string
   */
  get searchString() {
    return this._searchString;
  },

  /**
   * @return {number} the result code of this result object, either:
   *   RESULT_IGNORED   (invalid searchString)
   *   RESULT_FAILURE   (failure)
   *   RESULT_NOMATCH   (no matches found)
   *   RESULT_SUCCESS   (matches found)
   */
  get searchResult() {
    return this._searchResult;
  },

  /**
   * @return {number} the index of the default item that should be entered if
   *   none is selected
   */
  get defaultIndex() {
    return this._defaultIndex;
  },

  /**
   * @return {string} description of the cause of a search failure
   */
  get errorDescription() {
    return this._errorDescription;
  },

  /**
   * @return {number} the number of matches
   */
  get matchCount() {
    return this._results.length;
  },

  /**
   * @return {string} the value of the result at the given index
   */
  getValueAt: function(index) {
    return this._results[index];
  },

  /**
   * Get the final value that should be completed when the user confirms
   * the match at the given index.
   * @return {string} the final value of the result at the given index 
   */
  getFinalCompleteValueAt: function(index) {
    return this.getValueAt(index);
  },

  /**
   * Removes the value at the given index from the autocomplete results.
   * If removeFromDb is set to true, the value should be removed from
   * persistent storage as well.
   */
  removeValueAt: function(index, removeFromDb) {

    let item = this._results.splice(index, 1),
				i = coomanPlusCore.storage.search.indexOf(item[0]);

		if (i != -1)
			coomanPlusCore.storage.search.splice(i, 1);
  },

  getLabelAt: function(index) { return this._results[index]; },

  QueryInterface: XPCOMUtils.generateQI([ Ci.nsIAutoCompleteResult ])
};

/**
 * @constructor
 *
 * @implements {nsIAutoCompleteSearch}
 */
function ProviderAutoCompleteSearch() {
}

ProviderAutoCompleteSearch.prototype = {

  classID: CLASS_ID,
  classDescription : CLASS_NAME,
  contractID : CONTRACT_ID,

  /**
   * Searches for a given string and notifies a listener (either synchronously
   * or asynchronously) of the result
   *
   * @param searchString the string to search for
   * @param searchParam an extra parameter
   * @param previousResult a previous result to use for faster searchinig
   * @param listener the listener to notify when the search is complete
   */
  startSearch: function(searchString, searchParam, previousResult, listener) {
    let results = [],
    		isNew = true;
    searchString = searchString.replace(/^\s+|\s+$/g, "");
		
		for(let i of coomanPlusCore.storage.search)
		{
			if (!searchString || i.indexOf(searchString) != -1)
				results.push(i);
		}
		results.reverse();
    let autocomplete_result = new ProviderAutoCompleteResult(searchString,
        Ci.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "", results, null);

    listener.onSearchResult(this, autocomplete_result);
  },

  /**
   * Stops an asynchronous search that is in progress
   */
  stopSearch: function() {
  },

  QueryInterface: XPCOMUtils.generateQI([ Ci.nsIAutoCompleteSearch ])
};

// The following line is what XPCOM uses to create components
const NSGetFactory =
  XPCOMUtils.generateNSGetFactory([ ProviderAutoCompleteSearch ]);
