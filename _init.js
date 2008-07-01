log.app.wiki.info("Running wiki._init");
app.wiki = Object();

core.core.routes();

core.modules.wiki.wikiparser();
core.content.htmlhelper();

core.html.html();

core.util.diff();

core.modules.wiki.wiki();
core.modules.wiki.wikipage();
core.modules.wiki.wikipagehistory();


if (!(allowModule && allowModule.wiki)) {
    print("module error 1");
    return;
}

app.wiki.config = allowModule.wiki;
app.wiki.config.prefix = app.wiki.config.prefix || "";


app.wiki.routes = new Routes();
app.wiki.routes.search = "/~~/app/wiki/search";
app.wiki.routes.rss = "/~~/app/wiki/rss";
app.wiki.routes.add( /assets\/.*\.(js|css|jpg|gif|jpeg|png|ico)$/ , "/~~/app/wiki/$0" );
app.wiki.routes.add( /\/?(.*)/ , "/~~/app/wiki" , { names : [ "name" ] } );

