log.Wiki.info("Running wiki._init");
Wiki = Object();

core.core.routes();

core.modules.wiki.wikiparser();
core.content.htmlhelper();

core.html.html();

core.util.diff();

core.modules.wiki.wiki();
core.modules.wiki.wikipage();
core.modules.wiki.wikipagehistory();


Wiki.config = allowModule.wiki || {};
Wiki.config.prefix = Wiki.config.prefix || "";


Wiki.routes = new Routes();
Wiki.routes.search = "/~~/modules/wiki/search";
Wiki.routes.rss = "/~~/modules/wiki/rss";
Wiki.routes.add( /assets\/.*\.(js|css|jpg|gif|jpeg|png|ico)$/ , "/~~/modules/wiki/$0" );
Wiki.routes.add( /\/?(.*)/ , "/~~/modules/wiki/index.jxp" , { names : [ "name" ] } );

Wiki.getRoutes = function(){ return this.routes; }
