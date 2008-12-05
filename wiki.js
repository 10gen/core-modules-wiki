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

/**
 * Takes care of creating, modifying, and deleting wiki pages.
 * @namespace
 */
Wiki.WikiController = function() {};

/** The parser to use for the wiki markup.  Defaults to content.WikiParser. */
Wiki.WikiController.TEXT_PARSER = content.WikiParser;

/**
 * Renames an existing page.  This page must exist and cannot be read-only.  The new name must be valid and unique from existing wiki page names.
 * @param {WikiPage} wikiPage the page for which to change the name
 * @return {boolean} false if unsuccessful
 */
Wiki.WikiController.renamePage = function(wikiPage, newPageName) {
    // ensure we have a page
    if (!wikiPage) return false;
    if (Wiki.config.readOnly) return false;

    // ensure our newPageName is valid
    if (!Wiki.WikiController.validatePageName(newPageName)) return false;

    // ensure we don't have a page with the new name already
    if (db.wiki.findOne( { name: newPageName } )) {
        log.wiki.error("Can't rename page to " + newPageName + " since a page with that name already exists.");
        return false;
    } else {
        wikiPage.name = newPageName;
        db.wiki.save(wikiPage);
        response.setResponseCode( 302 );
        response.setHeader("Location", wikiPage.name);
        return true;
    }
};

/**
 * Checks that a string is a valid page name.  A valid page name is non-null, not empty, and not "Main".
 * @param {string} pageName name to check
 * @return {boolean} if the name was valid
 */
Wiki.WikiController.validatePageName = function(pageName) {
    // pageName can't be null or empty
    if (!pageName) return false;

    // pageName can't be empty
    pageName = pageName.trim();
    if (pageName == '') return false;

    // pageName can't be 'Main'
    if (pageName == 'Main') return false;
    else return true;
};

/**
 * Deletes the given wiki page.
 * @param {WikiPage} the page to delete
 * @return {boolean} false if the page could not be deleted
 */
Wiki.WikiController.deletePage = function(wikiPage) {
    log.wiki.debug('in delete');
    if (!wikiPage) return false;
    if (Wiki.config.readOnly) return false;

    // ensure we're not trying to delete the Main page
    if (wikiPage.name == 'Main') {
        log.wiki.error("Can't delete page Main");
        return false;
    }

    // ensure that the page is resident in the database
    if (!db.wiki.findOne( { name: wikiPage.name } )) {
        log.wiki.error("Can't delete page because it hasn't been saved yet: " + wikiPage.name);
        return false
    }

    db.wiki.deleted.save( wikiPage );
    db.wiki.remove(wikiPage);
    response.setResponseCode(302);
     // for ourselves to requery to make sure it is gone, and to get out of "POST" mode
    response.setHeader("Location", wikiPage.name);
};

/**
 * Creates a breadcrumb trail of navigation for a post.
 * @param {WikiPage} the post
 * @return {string} a series of links to the post's parents
 */
Wiki.WikiController.getCookieCrumb = function(wikiPage) {
    if (!wikiPage) return '';

    var cookieCrumb = '';
    var structuredName = wikiPage.getStructuredName();

    if (structuredName.length <= 1 ) return structuredName[0];

    // iterate through each name element and build up the rendered name
    var parentName = '';
    for (i = 0; i < structuredName.length; i++) {
        if (i == 0) parentName = structuredName[i];
        else parentName += '.' + structuredName[i];

        if (i > 0) cookieCrumb += '.';
        if (i == structuredName.length - 1) cookieCrumb += structuredName[i];
        else cookieCrumb += '<a href="' + parentName + '">' + structuredName[i] + '</a>';
    }

    return cookieCrumb;
};
