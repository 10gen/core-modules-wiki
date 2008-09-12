/**
*      Copyright (C) 2008 10gen Inc.
*  
*    Licensed under the Apache License, Version 2.0 (the "License");
*    you may not use this file except in compliance with the License.
*    You may obtain a copy of the License at
*  
*       http://www.apache.org/licenses/LICENSE-2.0
*  
*    Unless required by applicable law or agreed to in writing, software
*    distributed under the License is distributed on an "AS IS" BASIS,
*    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*    See the License for the specific language governing permissions and
*    limitations under the License.
*/

var clientLoader = new YAHOO.util.YUILoader();

var searchKeyListener;
var homeKeyListener;

var searchKeySelector = { alt: false, keys: 83 };
var homeKeySelector = { alt: false, keys: 72 };

var searchKeySelectorWebKit = { alt: true, keys: 83 };
var homeKeySelectorWebKit = { alt: true, keys: 72 };

var textFocus = false;

clientLoader.insert({
    require: ['event','dom'],
    base: '/@@/yui/current/',

    onSuccess: function(loader) {
        YAHOO.util.Event.onDOMReady( function() {
            // only set these up on a non-edit page
            if (!isEditPage) {
                if (YAHOO.env.ua.webkit) {
    		        searchKeyListener = new YAHOO.util.KeyListener(document, searchKeySelectorWebKit, handleSearchKeyPress);
                } else {
    		        searchKeyListener = new YAHOO.util.KeyListener(document, searchKeySelector, handleSearchKeyPress);
                }
                searchKeyListener.enable();
            }

            if (YAHOO.env.ua.webkit) {
                homeKeyListener = new YAHOO.util.KeyListener(document, homeKeySelectorWebKit, handleHomeKeyPress);
            } else {
                homeKeyListener = new YAHOO.util.KeyListener(document, homeKeySelector, handleHomeKeyPress);
            }
            homeKeyListener.enable();
        });
    }
});

var handleSearchKeyPress = function() {
    if(document.getElementById("searchtext") && textFocus) return;
    window.location = 'search';
}

var handleHomeKeyPress = function() {
    if(document.getElementById("searchtext") && textFocus) return;
    window.location = 'Main';
}

/* --- wiki language selector stuff below --- */

// Display preferred pre area for code snippets
function displayPreferredPre (tag, id, numElem) {
    var counter = 0;
    var elem = document.getElementsByTagName(tag);
    for ( i = 0; i < elem.length; i++ ) {
	// ignore misc pre tags
	if ( elem[i].className == "hide_pre" || elem[i].className == "show_pre" ) {
	    if ( counter%numElem == 0 ) counter = 0;
	    counter ++;
	    if ( counter == id ) {
		elem[i].className = 'show_pre';
	    } else {
		elem[i].className = 'hide_pre';
	    }
	}
    }
}

// set select value for preferred language
function setSelectValue (tag, lang) {
    var elem = document.getElementsByTagName(tag);
    for ( i = 0; i < elem.length; i++ ) {
	// ignore misc pre tags
	if ( elem[i].className == "pref_lang" ) {
	    elem[i].value = lang;
	}
    }
}

// Delete cookie function
function deleteCookie ( cookie_name ) {
    var cookieDate = new Date ( );  // current date & time
    cookieDate.setTime ( cookieDate.getTime() - 1 );
    document.cookie = cookie_name += "=; expires=" + cookieDate.toGMTString();
}

// If cookie is not set set preferredLanguage to javascript on the front end
if ( ! getCookie ( "preferredLanguage" ) ) {
    var preferredLanguage = "javascript";
} else {
    var preferredLanguage = getCookie ( "preferredLanguage" );
}

// Change preferred language
function changePreferred ( selectValue, selectIndex, selectLength ) {
    var preferredLanguage = selectValue;
    var preferredIndex = selectIndex + 1;
    var numElements = selectLength;
    var cookieExp = 365*24;
    displayPreferredPre( 'pre', preferredIndex, numElements );
    setSelectValue( 'select', preferredLanguage ); 
    setCookie ( 'preferredLanguage', preferredLanguage, cookieExp ); 
}

