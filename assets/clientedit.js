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

var clientEditLoader = new YAHOO.util.YUILoader();

var editKeyListener;
var saveKeyListener;

var editKeySelector = { alt: false, keys: 69 };
var saveKeySelector = { ctrl: true, keys: [13, 3] };

var editKeySelectorWebKit = { alt: true, keys: 69 };
var saveKeySelectorWebKit = { alt: true, keys: 83 };

clientEditLoader.insert({
    require: ['event','container','dom','connection','element','button','editor'],
    base: '/@@/yui/current/',

    onSuccess: function(loader) {
            YAHOO.util.Event.onDOMReady( function() {
                // create the delete dialog
                deleteDialog = new YAHOO.widget.Dialog("xgen-delete-popup", {
                                        fixedCenter: true,
                                        visible: false,
                                        fixedCenter: true,
                                        constraintoviewport: true,
                                        draggable: false,
                                        modal: true,
                                        postmethod: 'form',
                                        buttons: [ { text: "Cancel", handler: handleCancel, isDefault: true},
                                                   { text: "Delete Page", handler: handleConfirm } ]
                                    });
                deleteDialog.cfg.setProperty("icon", YAHOO.widget.SimpleDialog.ICON_WARN);
                deleteDialog.setHeader('Confirm Delete');
                deleteDialog.setBody('Are you sure you want to delete this page? Deleting a page cannot be undone.');
                deleteDialog.render();
                deleteDialog.registerForm();
                deleteElement = document.createElement("input");
                deleteElement.name = 'delete';
                deleteElement.type = 'hidden';
                deleteElement.value = true;
                deleteDialog.form.appendChild(deleteElement);

                // create the rename dialog
                renameDialog = new YAHOO.widget.Dialog("xgen-rename-popup", {
                                        fixedCenter: true,
                                        visible: false,
                                        fixedCenter: true,
                                        constraintoviewport: true,
                                        draggable: false,
                                        modal: true,
                                        postmethod: 'form',
                                        buttons: [ { text: "Cancel", handler: handleCancel, isDefault: true},
                                                   { text: "Rename Page", handler: handleConfirm } ]
                                    });
                renameDialog.cfg.setProperty("icon", YAHOO.widget.SimpleDialog.ICON_WARN);
                renameDialog.render();

                // only set these up on a non-edit page
                if (!isEditPage) {
                    if (YAHOO.env.ua.webkit) {
                        editKeyListener = new YAHOO.util.KeyListener(document, editKeySelectorWebKit, handleEditKeyPress);
                    } else {
                        editKeyListener = new YAHOO.util.KeyListener(document, editKeySelector, handleEditKeyPress);
                    }
                    editKeyListener.enable();
                }

                // only set this up on an edit page
                if (isEditPage) {
                    if (YAHOO.env.ua.webkit) {
                        saveKeyListener = new YAHOO.util.KeyListener(document, saveKeySelectorWebKit, handleSaveKeyPress);
                    } else {
                        saveKeyListener = new YAHOO.util.KeyListener(document, saveKeySelector, handleSaveKeyPress);
                    }
                    saveKeyListener.enable();
                }

                // Reset the rename input (see the bugtracker for info)
                document.getElementById("newNameInput").value = document.getElementById("newNameInput").defaultValue;
            });
    }
});

var handleEditKeyPress = function() {
    if(document.getElementById("searchtext") && textFocus) return;
    // redirect to edit page
    window.location = window.location.toString().replace(/#.+$/, '') + "?edit=true";
}

var handleDeleteClick = function() {
    document.getElementById('xgen-delete-popup').style.display = "block";
    deleteDialog.show();
    editKeyListener.disable();
    if(isEditPage){
        saveKeyListener.disable();
    }
    searchKeyListener.disable();
    homeKeyListener.disable();
}

var handleRenameClick = function() {
    document.getElementById('xgen-rename-popup').style.display = "block";
    renameDialog.show();
    editKeyListener.disable();
    if(isEditPage){
        saveKeyListener.disable();
    }
    searchKeyListener.disable();
    homeKeyListener.disable();
}

var handleSaveKeyPress = function(e, obj) {
    document.forms.wiki_edit_form.submit();
}

var handleConfirm = function() {
    this.submit();
    editKeyListener.enable();
    if(isEditPage){
        saveKeyListener.enable();
    }
    searchKeyListener.enable();
    homeKeyListener.enable();
}

var handleCancel = function() {
    this.hide();
    editKeyListener.enable();
    if(isEditPage){
        saveKeyListener.enable();
    }
    searchKeyListener.enable();
    homeKeyListener.enable();
};
