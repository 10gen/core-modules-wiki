log.wiki.info("importing wikipage history, app="+app+" Wiki="+Wiki);

/**
 * Initializes a new piece of history for a wiki page.
 * @param {ObjectId} wikiPageId the id of the page
 * @param {string} textDiff a diff of the change made to the wiki page
 * @param {user} who the user who made the change
 * @constructor
 */
Wiki.WikiPageHistory = function(wikiPageId, textDiff , who ) {
    this.parent = wikiPageId;
    this.diff = textDiff;
    this.user = who;

    this.ts = new Date();
};

if (db) {
    db.wiki_history.ensureIndex( { ts: 1 } );
    db.wiki_history.ensureIndex( { parent : 1 } );

    db.wiki_history.setConstructor( Wiki.WikiPageHistory );
}


/**
 * Gets the full text of a specific historical version of the current page
 * @return the text of the wiki page representing the version requested
 */
// TODO this should allow diffs between two WikiPageHistory objects
Wiki.WikiPageHistory.prototype.getHistoricalText = function() {
    // get our parent WikiPage
    var wikiPage = db.wiki.findOne( { _id : this.parent } );
    if (!wikiPage) throw new Exception("Can't find my WikiPage parent!");

    // Get the list of all WikiPageHistory objects for the current page. We assume this is in reverse chronological order.
     var wikiPageHistories = wikiPage.getWikiPageHistories();

     // iterate through each WikiPageHistory object, in reverse chronological order
     // for each WikiPageHistory object, apply the diff backwards (to back out the changes)
     // stop after we've processed the wikiPageHistory requested (after applying the backwards diff).
     var historicalText = wikiPage.text;
     for (var i in wikiPageHistories) {
         wikiPageHistory = wikiPageHistories[i];
         historicalText = Util.Diff.applyBackwards(historicalText, wikiPageHistory.diff);

         if (this._id == wikiPageHistory._id) break;
     }
     return historicalText;
};

/**
 * Gets the diff from this wiki history.
 * @return {string} the diff of this wiki history
 */
Wiki.WikiPageHistory.prototype.getDiff = function() {
    return this.diff;
};
