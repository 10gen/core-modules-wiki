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

return;

// Tests won't work, because they run against wiki "stable"
s = "=hi there=#some-anchor\n";
o = w.toHtml(s);
assert.eq(o, "<h1 id=\"some-anchor\">hi there</h1>\n");

// FIXME: this might be a bug instead of a feature, but it's existing behavior
s = "=hi there=blah blah";
o = w.toHtml(s);
assert.eq(o, "<h1>hi there</h1>blah blah\n");
