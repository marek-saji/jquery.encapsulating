textarea encapsulating jQuery plugin
====================================

You can usually see this in in tag fields.

Usage
-----

    <script type="text/javascript" src="jquery.encapsulating.js"></script>
    <link rel="stylesheet" type="text/cxx" href="jquery.encapsulating.css" />
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.4.4.min.js"></script>
    <script type="text/javascript">
       $(function(){
           $('textarea').encapsulating();

           // you may also specify settings here
           $('textarea.tags').encapsulating({
               editTitle: 'click to edit this tag'
           });
       });
    </script>

You can also specify settings with `data-encapsulating` attribute:

    <textarea data-encapsulating='{"debug": true}'>
        first tag, 2nd tag
        last tag
    </textarea>

Settings
--------


### removeText
default value: '×'

Text to display at button that deletes an item.

### removeTitle
default value: ''

Value of title attribute of a button that deletes an item.

### editTitle
default value: ''

Value of item title attribute.

### debug
default value: false

When debug is enabled, original textarea element is visible.

