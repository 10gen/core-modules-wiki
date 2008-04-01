/* translate wiki markup to html 
   see http://www.10gen.com/wiki/wiki.markup

   todo: move this file to /app/wiki/ folder?

   options:
     set app.wiki.programmer=false to disable "programmer" extensions to the wiki; for example the 
       programmer extensions auto-link "core.module();" statements in the wiki.
*/

content.WikiParser = function() {
    this.prefixRE = null;
    this.outp = undefined;
    this.noWiki = 0;
    this.noHtml = 0; // normally we allow html tags within the wiki markup
    this.level = 0;
    this.inRow = false;

    // ==header==
    this.h = [
        { r: /^=====\s*(.*)\s*=====/, s: "<h5>$1</h5>" },
        { r: /^====\s*(.*)\s*====/, s: "<h4>$1</h4>" },
        { r: /^===\s*(.*)\s*===/, s: "<h3>$1</h3>" },
        { r: /^==\s*(.*)\s*==/, s: "<h2>$1</h2>" },
        { r: /^=\s*(.*)\s*=/, s: "<h1>$1</h1>" } ];

    // [[links]]
    this.link = [
        { r: /\[\[([^|\[]+)\|([^\[]+)\]\]/g , s: '<a href="$1">$2</a>' }, // [[link|pretty text]]
        { r: /\[\[([^\[]+)\]\]/g , s: '<a href="$1">$1</a>' }, // [[link]]
        // FIXME: this following regexp doesn't eat trailing spaces, because
        // the name part matches "anything which isn't a bracket"; probably
        // this is correct, because a name-part can have spaces in it.
        { r: /\[\s*([^ \[]+\/[^ \[]+) +([^\[]+)\s*\]/g , s: '<a href="$1">$2</a>' }, // [http://zzz name]
        // If there was anything after trailing space, it would match the above
        // regexp, so match up to "anything which isn't a space or a bracket".
        { r: /\[\s*([^\[]+\/[^ \[]+)\s*\]/g , s: '<a href="$1">$1</a>' }, // [http://zzz]
        ];

    this.urls = [
        //{ r: /(http:\/\/[^ ]*)/g, s: '<a href="$1">$1</a>' }, // http://link
        { r: /((^|\w|\])\s*)((http[s]?|ftp):\/\/[^ \n\t]*)(\.([ \t\n]|$))/g, s: '$1[$3]$5'}, // raw URL
        { r: /((^|\w|\])\s*)((http[s]?|ftp):\/\/[^ \n\t]*)([ \t\n]|$)/g, s: '$1[$3]$5'}, // raw URL
        ];

    this.basics = [
        { r: /'''(.+?)'''/g , s: "<strong>$1</strong>" }, // '''bold'''
        { r: /''(.+?)''/g , s: "<em>$1</em>" }, // ''italics''
    ];

    // wiki extensions helpful for development
    // the first rule here automatically marks up a core.foo() tag to link to 
    // the associated corejs.10gen.com/admin/doc page.
    this.programmer = [ 
        { r: /^([^\[]*)core\.([a-zA-Z0-9_.]+)\(\)/g, 
	  s: function(a,b,c) { 
               return b + '<a href="http://corejs.10gen.com/admin/doc?f=/' +
	       c.replace(/[.]/, "/") + '">' + "core." + c + '()</a>';
	     }
        }
    ];
};

content.WikiParser._repl = function(patts, str) {
    for( var i = 0; i < patts.length; i++ ) {
        str = str.replace(patts[i].r, patts[i].s);
    }
    return str;
};

content.WikiParser.prototype._reLevel = function(newLevel) {
    var str = "";
    while ( this.level < newLevel ) {
        this.level++;
        str = "<ul>" + str;
    }

    while ( this.level > newLevel ) {
        this.level = this.level-1;
        str = "</ul>" + str;
    }

    this.outp += str;
};

content.WikiParser.prototype._line = function(str) {
    var trimmed = str.trim();
    var newLevel = 0;

    if( trimmed.length == 0 ) { this.outp += "<p>\n"; return; }
    if( trimmed == "</nowiki>" ) { this.noWiki = 0; return; }
    if( trimmed == "</nohtml>" ) { this.noHtml = 0; return; }
    if( trimmed == "</prenh>" ) { this.noWiki = 0; this.noHtml=0; this.outp+="</pre>\n"; return; }
    if( trimmed == "</pre>" ) { this.outp+="</pre>\n"; return; }
    if( trimmed == "<prenh>" ) {
        this._reLevel(newLevel); this.noWiki=1; this.noHtml=1; this.outp += "<pre>"; return;
    }
    if( trimmed == "<pre>" ) { this._reLevel(newLevel); this.outp += "<pre>"; return; }
    if( trimmed == "<nowiki>" ) { this.noWiki++; return; }
    if( trimmed == "<nohtml>" ) { this.noHtml++; return; }

    if( this.noHtml ) {
        str = str.replace(/</g, "&lt;");
        str = str.replace(/>/g, "&gt;");
    }

    // our simple table stuff
    if ( str.match(/^[|;] /) ) {
        if( str.match( /^[|] / ) ) {
            str = str.replace( /^[|] (.*)/, "<tr><td>$1</td>" );
            if( this.inRow ) str = "</tr>" + str;
            this.inRow = true;
        } else {
            str = str.replace( /^; (.*)/, "<td>$1</td>" );
        }
    } else if( str.match( /<\/table/ ) ) {
        if( this.inRow ) {
            this.inRow = false;
            str = "</tr>" + str;
        }
    }

    if( this.noWiki>0 ) { this._reLevel(newLevel); this.outp += (str+"\n"); return; }

    // ==headers==
    if( str.match(/^=.*[^=]+=/) ) {
        str = content.WikiParser._repl(this.h, str);
    }

    // raw urls - disabled, see above
    str = content.WikiParser._repl(this.urls, str);

    if( str.match(/core/) && app.wiki && (app.wiki.programmer==null || !app.wiki.programmer) ) {
	var old = str;
	str = content.WikiParser._repl(this.programmer, str);
	if( str != old ) {
	    print("old:" + old +'\n');
	    print("str:" + str +'\n');
	}
    }

    // links
    if( str.match(/\[/) ) {
        if( this.prefixRE ) str = str.replace(this.prefixRE, '[[');
        str = content.WikiParser._repl(this.link, str);
    }

    // the basics
    str = content.WikiParser._repl(this.basics, str);

    // * bullets
    if( str.match(/^\*/) ) {
        var stars = "" + str.match(/^\*+/);
//        stars = stars.replace( /\*/g, "u" );
        newLevel = stars.length;
        str = str.replace( /^(\*+ *)(.*)/, '<li class="u">$2</li>');
    }

    this._reLevel(newLevel);

    str += '\n';
    this.outp += str;
};

content.WikiParser.prototype._reset = function() {
    this.prefixRE = null;
    this.outp = "";
    this.noWiki = 0;
    this.level = 0;
};

content.WikiParser.prototype.toHtml = function(str, prefix) {
    this._reset();
    if( prefix && prefix.length ) {
        var s = prefix.replace(/\./g, '\.');
        this.prefixRE = RegExp("\\[\\[" + s, 'g');
    }

    var ln = str.split(/\r?\n/);
    for( var i = 0; i < ln.length; i++ ) {
        this._line(ln[i]);
    }
    return this.outp;
};

content.WikiParser._chk = function(a,b) {
    var wikiParser = new content.WikiParser();
    r = wikiParser.toHtml(a);
    if( r != b )
    print("CHK FAILS: " + a + "\n got " + r + "\n expected: " + b);
};

// unit test
content.WikiParser.test = function() {
    content.WikiParser._chk("=foo=", "<h1>foo</h1>\n");
    content.WikiParser._chk("=foo", "=foo\n");
    content.WikiParser._chk("[[lnk]]", '<a href="lnk">lnk</a>\n');
    content.WikiParser._chk("in '''bold'''", "in <b>bold</b>\n");
    content.WikiParser._chk("<b>", "<b>\n");
    content.WikiParser._chk("<nohtml>\n<b>", "&lt;b&gt;\n");
    content.WikiParser._chk("*** test", "<ul><ul><ul><li class=\"u\">test</li>\n");
    print("---------\nTest Done\n");
};


