core.modules.wiki.wikiparser();

// Test that the wiki parser doesn't eat spaces.

s = " http://manuals.rubyonrails.com exists ";

w = new content.WikiParser();
o = w.toHtml(s);
var r = /(.*)<a.+href="(.*?)">(.*)<\/a>(.*)/;
var m = r.exec(o);
assert(m[1] == " ");
assert(m[2] == "http://manuals.rubyonrails.com");
assert(m[3] == "http://manuals.rubyonrails.com");
assert(m[4] == " exists ");

s = "http://manuals.rubyonrails.com ";
o = w.toHtml(s);
var m = r.exec(o);
assert(m[1] == "");
assert(m[2] == "http://manuals.rubyonrails.com");
assert(m[3] == m[2]);
assert(m[4] == " ");

s = "[ http://manuals.rubyonrails.com ]";
o = w.toHtml(s);
var m = r.exec(o);
assert(m[1] == "");
assert(m[2] == "http://manuals.rubyonrails.com");
assert(m[3] == m[2]);
assert(m[4] == "");

s = "[ http://manuals.rubyonrails.com ] here";
o = w.toHtml(s);
var m = r.exec(o);
assert(m[1] == "");
assert(m[2] == "http://manuals.rubyonrails.com");
assert(m[3] == m[2]);
assert(m[4] == " here");

s = "[ http://manuals.rubyonrails.com rails] here";
o = w.toHtml(s);
var m = r.exec(o);
assert(m[1] == "");
assert(m[2] == "http://manuals.rubyonrails.com");
assert(m[3] == "rails");
assert(m[4] == " here");

s = "this is %some code%";
o = w.toHtml(s);
assert(o == "this is <code>some code</code>\n");


s = "this is 100% pure code";
o = w.toHtml(s);
assert(o == "this is 100% pure code\n");

