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

log.Wiki.info("db: " + db);

if (db) {
    db.wiki.ensureIndex( { name : 1 } );
    db.wiki.ensureIndex( { lastEdit : 1 } );

    db.wiki.setConstructor( Wiki.WikiPage );
}

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

    childPages.forEach( function(childPage) {
        childPage.name = childPage.name.replace(new RegExp('^' + Wiki.config.prefix), '');
    });

    return childPages;
};

