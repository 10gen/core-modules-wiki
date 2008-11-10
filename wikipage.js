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

log.Wiki.info("Running wikipage.js.");

/**
 * Initializes a new page in the wiki.  This is called when someone goes to a page that has not yet been created.
 * @param {string} name the name of the wiki page
 * @constructor
 */
Wiki.WikiPage = function(name) {
    this.name = name || '';
    this.text = 'New WikiPage';
    this.lastEdit = new Date();
    this.files = [];
};

if (db) {
    db.wiki.ensureIndex( { name : 1 } );
    db.wiki.ensureIndex( { lastEdit : 1 } );
    db.wiki.setConstructor( Wiki.WikiPage );
    Search.fixTable(db.wiki, {_searchIndex:1, _searchIndex_0_2: .2});
}

/**
 * For searches
 */
Wiki.WikiPage.prototype.SEARCH_FIELDS = { name : 1 , text : .2 };
Wiki.WikiPage.prototype.SEARCH_OPTIONS = {};

Wiki.WikiPage.prototype.presave = function(){
    var extraFields = Ext.getlist(allowModule, 'wiki', 'extraFields') || {};
    for(var key in extraFields){
        var weight = Ext.getlist(extraFields, key, 'searchWeight');
        if(weight != null)
            Wiki.WikiPage.prototype.SEARCH_FIELDS[key] = weight;
    }

    Search.index( this , this.SEARCH_FIELDS , this.SEARCH_OPTIONS );
};


/**
 * Returns an array with the page name components split into an array.
 * @return {Array} the heirarchy of pages leading to this page
 */
Wiki.WikiPage.prototype.getStructuredName = function() {
    return this.getDisplayName().split(/[.]/);
};

/**
 * If a prefix is set in the wiki's configuration options, return this page's name with the prefix removed.
 * @return {string} the modified name of this page
 */
Wiki.WikiPage.prototype.getDisplayName = function() {
    return this.name.replace(new RegExp('^' + Wiki.config.prefix), '');
};

/**
 * Parses this page's wiki markup text into another format (HTML by default).
 * @param {string} [device] type of markup to produce
 * @param {Object} [result] object in which to put options created by the formatter
 * @return {string} the parsed text
 */
Wiki.WikiPage.prototype.getParsedText = function(device, result) {
    if ( ! this.text )
        return "";
    if ( this.text.trim().length == 0 )
        return "";

    return this.formatText(this.text, device, result);
};

/**
 * Formats text in wiki markup into another format.
 * @param {string} text the article text to format
 * @param {string} [device] type of markup to produce
 * @param {Object} [result] object in which to put options created by the formatter
 * @return {string} the parsed text
 */
Wiki.WikiPage.prototype.formatText = function(text, device, result){
    var s = (new Wiki.WikiController.TEXT_PARSER(device, result)).toHtml(text, Wiki.config.prefix, this.name);//.trim();
    if ( s.length == 0 )
        throw "parser broken?";

    return s;
};

/**
 * Updates the text of a saved WikiPage with the new text. The new text is expected to be in a markup language.
 * @param {string} newText text to which to change this wiki page's content
 * @returns {boolean} true if page was properly saved with history, false if newText was empty or wiki is read only.
 */
Wiki.WikiPage.prototype.setText = function(newText) {
    if (!newText || newText.length == 0) return false;
    if (Wiki.config && Wiki.config.readOnly) return false;

    // get a diff of the text of the Wiki, and save it in a WikiHistory object.
    var textDiff = Util.Diff.diff(this.text, newText);

    var wikiPageHistory = new Wiki.WikiPageHistory(this._id, textDiff, user);

    // change the wikiPage text now, after we have an historical log.
    this.text = newText;

    this.lastEdit = new Date();
    // save the updated wikiPand the history for the page.
    db.wiki.save(this);

    // If the page is new, the parent needs to be set (again).
    if(wikiPageHistory.parent == null) wikiPageHistory.parent = this._id;
    db.wiki_history.save(wikiPageHistory);
};

/**
 * Gets the list of all WikiPageHistory objects for the current page
 * @returns {WikiPageHistory} the history, or null if no history is found
 */
Wiki.WikiPage.prototype.getWikiPageHistories = function() {
    // get the WikiPageHistory objects for the current page
    return db.wiki_history.find( { parent: this._id } ).sort( { ts: -1 } );
};

/**
 * Finds the latest edit on the page.
 * @return {WikiPageHistory} this page's latest change
 */
Wiki.WikiPage.prototype.getLastEdit = function(){
    var cursor = this.getWikiPageHistories();
    if ( ! cursor.hasNext() )
        return null;
    return cursor.next();
}

/**
 * Gets the WikiPageHistory object identified by the given id
 * @returns {WikiPageHistory} the history, or null if no history is found
 */
Wiki.WikiPage.prototype.getWikiPageHistory = function(wikiPageHistoryId) {
    // get the WikiPageHistory objects for the current page
    return db.wiki_history.findOne( { parent: this._id, _id: wikiPageHistoryId } );
}

/**
 * Returns any pages whose name starts with the name of this article.
 * @return {Array} an array of child pages
 */
Wiki.WikiPage.prototype.getChildPages = function() {
    var pageNameRegularExpression = /^[^.]+$/;
    if (this.name != Wiki.config.prefix + "Main") pageNameRegularExpression = RegExp("^" + this.name + "\.[^.]+$");
    else if (Wiki.config.prefix) pageNameRegularExpression = RegExp("^" + Wiki.config.prefix + "\.[^.]+$");

    var childPages = db.wiki.find( { name: pageNameRegularExpression } ).sort( { name: 1 } ).toArray();

    var currentPageName = this.name;
    childPages = childPages.filter( function( c ) {
        return c.name != currentPageName;
    });
    childPages.forEach( function(childPage) {
        childPage.name = childPage.name.replace(new RegExp('^' + Wiki.config.prefix), '');
    });

    return childPages;
};

Wiki.WikiPage.prototype.getInternalLinkNames = function() {
    var a = new Array();
    var tempA;
    var strings = this.text.split("\n");
    
    for (n in strings) {
        s = strings[n];
        while ((tempA = /\[\[([^|\[]+)\|[^\[]+\]\]/g.exec(s)) != null) // [[link|pretty text]]
            a.push(tempA[1]);

        while ((tempA = /\[\[([^|\[]+)\]\]/g.exec(s)) != null) // [[link]]
            a.push(tempA[1]);

    	// forward chapter links [[fwd}}
    	// pdf mode uses these to chain together pages
        // \\? is because of tex pre-escaping brace
        while ((tempA = /\[\[(.+?)\|.+?\\?\}\\?\}/g.exec(s)) != null) // [[link|pretty text}}
            a.push(tempA[1]);
    
        while ((tempA = /\[\[([^|]+?)\\?\}\\?\}/g.exec(s)) != null) // [[link}}
            a.push(tempA[1]);
    
    	// backward chapter links [[fwd}}
    	// pdf mode doesn't display as it assumes everything is stiched together
    	while ((tempA = /\\?\{\\?\{([^|\[]+)\|[^\[]+\]\]/g.exec(s)) != null) // [[link|pretty text}}
    	    a.push(tempA[1]);
    
    	while ((tempA = /\\?\{\\?\{([^|\[]+)\]\]/g.exec(s)) != null) // [[link}}
    	    a.push(tempA[1]);
    }
    
    var names = new Array();
    
    if (a.length == 0) {
        return names;
    }
    
    for (i in a) {
        var temp = a[i].replace(/\/wiki\//, "").trim();
        if ( allowModule && allowModule.wiki && allowModule.wiki.prefix ){
            if ( ! temp.startsWith( allowModule.wiki.prefix ) )
                temp = allowModule.wiki.prefix + temp;
        }
        names.push(temp);
    }
    return names;
};

Wiki.WikiPage.prototype.getLinkedPages = function() {
    var names = this.getInternalLinkNames();
    
    var re = "^";
    for (i in names) {
        re += names[i];
        if (i < names.length - 1)
            re += "$|^"
    }
    re += "$"
    return db.wiki.find({name: new RegExp(re, "i")});
};
