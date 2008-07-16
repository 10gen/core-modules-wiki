/*
 *  Wiki app-module installation script; cribbed from the blog
 */

Wiki.config = arguments[0] || {}
Wiki.config.prefix = Wiki.config.prefix || "";

addModule("wiki", Wiki._options);

return Wiki;
