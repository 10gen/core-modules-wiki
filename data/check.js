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
                if ( ! db.wiki.findOne( { name: new RegExp( "^" + allLinks[i] + "$", "i" ) })) {
                    deadLinks.push(allLinks[i]);
                }
            }
            if (deadLinks.length)
                dlList[p.name] = deadLinks;
        }
    );
    return dlList;
};

print(tojson(Wiki.getDeadLinks()));
