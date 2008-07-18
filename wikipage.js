log.Wiki.info("Running wikipage.js.");

Wiki.WikiPage = function(name) {
    this.name = name || '';
    this.text = 'New WikiPage';
    this.lastEdit = new Date();
    this.files = [];
};

log.Wiki.info("db: " + db);

if (db) {
    db.wiki.ensureIndex( { name : 1 } );
    db.wiki.ensureIndex( { lastEdit : 1 } );

    db.wiki.setConstructor( Wiki.WikiPage );
}

/**
 * returns an array with the page name components split into an array
 */
Wiki.WikiPage.prototype.getStructuredName = function() {
    return this.getDisplayName().split(/[.]/);
};

Wiki.WikiPage.prototype.getDisplayName = function() {
    return this.name.replace(new RegExp('^' + Wiki.config.prefix), '');
};

Wiki.WikiPage.prototype.getParsedText = function(device, result) {
    if ( ! this.text )
        return "";
    if ( this.text.trim().length == 0 )
        return "";

    return this.formatText(this.text, device, result);
};

Wiki.WikiPage.prototype.formatText = function(text, device, result){
    var s = (new Wiki.WikiController.TEXT_PARSER(device, result)).toHtml(text, Wiki.config.prefix, this.name);//.trim();
    if ( s.length == 0 )
        throw "parser broken?";

    return s;
};

/**
 * Updates the text of a saved WikiPage with the new text. The new text is expected to be in a markup language.
 * @returns true if page was properly saved with history, false if newText was empty or wiki is read only.
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
 * @returns null if no history is found
 */
Wiki.WikiPage.prototype.getWikiPageHistories = function() {
    // get the WikiPageHistory objects for the current page
    return db.wiki_history.find( { parent: this._id } ).sort( { ts: -1 } );
};

Wiki.WikiPage.prototype.getLastEdit = function(){
    var cursor = this.getWikiPageHistories();
    if ( ! cursor.hasNext() )
        return null;
    return cursor.next();
}

/**
 * Gets the WikiPageHistory object identified by the given id
 * @returns null if no history is found
 */
Wiki.WikiPage.prototype.getWikiPageHistory = function(wikiPageHistoryId) {
    // get the WikiPageHistory objects for the current page
    return db.wiki_history.findOne( { parent: this._id, _id: wikiPageHistoryId } );
}

Wiki.WikiPage.prototype.getChildPages = function() {
    var pageNameRegularExpression = /^[^.]+$/;
    if (this.name != Wiki.config.prefix + "Main") pageNameRegularExpression = RegExp("^" + this.name + "\.[^.]+$");
    else if (Wiki.config.prefix) pageNameRegularExpression = RegExp("^" + Wiki.config.prefix + "\.[^.]+$");

    var childPages = db.wiki.find( { name: pageNameRegularExpression } ).sort( { name: 1 } ).toArray();

    childPages.forEach( function(childPage) {
        childPage.name = childPage.name.replace(new RegExp('^' + Wiki.config.prefix), '');
    });

    return childPages;
};

Wiki.WikiPage.prototype.getLinkedPages = function() {
    a = new Array();
    var tempA;
    strings = this.text.split("\n");
    
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
    
    if (a.length == 0) {
        return null;
    }
    
    re = "^"
    for (i in a) {
        re += a[i].replace(/\/wiki\//, "").trim();
        if (i < a.length - 1)
            re += "$|^"
    }
    re += "$"
    return db.wiki.find({name: new RegExp(re, "i")});
};

