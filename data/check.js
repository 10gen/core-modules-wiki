if(! db)
    db = connect("admin");

if(! Wiki) {
    Wiki = {};
    core.modules.wiki.wikiPage();
}

var markHelper = function(currentPage, marked) {
    if (marked[currentPage.name]) {
        return marked;
    }
    marked[currentPage.name] = true;
    linked = currentPage.getLinkedPages();
    if (linked) {
        linked.forEach(function(link) {
            markHelper(link, marked);
        });
    }
    return marked;
};

var mark = function(rootName) {
    root = db.wiki.findOne({name: rootName});
    marked = {};
    if (root)
        markHelper(root, marked);
    return marked;
};

Wiki.getUnreachables = function(rootName) {
    marked = mark(rootName);
    swept = new Array();
    all = db.wiki.find().forEach(
        function(u) {
            if (!marked[u.name]) {
                swept.push(u);
            }
        });
    return swept;
}

//print(tojson(Wiki.getUnreachables("Main")));