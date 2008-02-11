app.bugtracker.data.helper = {
    getlist: function(){
        //SYSOUT(getlist(app, "bugtracker", "data", "helper", "getlist") == app.bugtracker.data.helper.getlist);
        var obj = arguments[0];
        var i = 1;
        while(obj && i < arguments.length){
            obj = obj[arguments[i]];
            ++i;
        }
        return obj;
    },

    select: function(obj, field, prefix, opts, view, value){
        s = "";
        s += "<select name=\""+prefix+field+"\">";
        var orig = obj[field];
        if(! opts){
            var field_c = field.toUpperCase();
            var opts = obj[field_c];
        }
        for(var f in opts){
            var text = opts[f];
            if(view) text = view(text);
            var val = opts[f];
            if(value) val = value(val);
            s += "<option";
            // This paranoid check prevents the possibility of opts[f] being
            // false or null and getting an exception when you access
            // opts[f]._id.
            // We use this in bugtracker by passing a list of options for Users,
            // of which one is a false "No user selected" object.
            // We need to be able to check if this was the selected user, but we
            // also need to be able to check if this wasn't.
            // If opts[f] is some string, then ._id for both objects will be
            // null, so don't accept that.
            if((opts[f] == orig) || (opts[f] && opts[f]._id && orig && orig._id && opts[f]._id == orig._id))
                s += " selected=1"

            if(opts[f] != val)
                s += " value=\""+ val +"\"";
            s += ">";
            s += text;
            s += "</option>";
        }
        s += "</select>";
        return s;
    }
};