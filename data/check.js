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

if(! db)
    db = connect("admin");

if(! Wiki) {
    Wiki = {};
    core.modules.wiki.wikiPage();
};

var markHelper = function(currentPage, marked) {
    if (marked[currentPage.name]) {
        return marked;
    }
    marked[currentPage.name] = true;
    var linked = currentPage.getLinkedPages();
    if (linked) {
        linked.forEach(function(link) {
            markHelper(link, marked);
        });
    }
    return marked;
};

var mark = function(rootName) {
    var root = db.wiki.findOne( { name: new RegExp( "^" + rootName + "$" , "i" ) });
    var marked = {};
    if (root)
        markHelper(root, marked);
    return marked;
};

Wiki.getUnreachables = function(rootName) {
    var marked = mark(rootName);
    var names = marked.keySet().map( 
        function(z){ 
            return z.toLowerCase();
        }
    );
    
    var swept = new Array();
    db.wiki.find().forEach(
        function(u) {
            if ( ! names.contains( u.name.toLowerCase() ) ){
                swept.push(u);
            }
        }
    );
    return swept;
};

Wiki.getDeadLinks = function() {
    var dlList = {};
    db.wiki.find().forEach(
        function(p) {
            var deadLinks = new Array();
            var allLinks = p.getInternalLinkNames();
            for (i in allLinks) {
                if ( ! db.wiki.findOne( { name: new RegExp( "^" + RegExp.quote( allLinks[i] ) + "$", "i" ) })) {
                    deadLinks.push(allLinks[i]);
                }
            }
            if (deadLinks.length)
                dlList[p.name] = deadLinks;
        }
    );
    return dlList;
};


