// = encapsulating textarea, jQuery plugin =
//
// * author: Marek 'saji' Augustynowicz
// * license: MIT (LICENSE.md file should be distributed with the code)
// * http://github.com/marek-saji/jquery.encapsulating
//
// == USAGE ==
// {{{
// <link rel="stylesheet" type="text/cxx" href="jquery.encapsulating.css" />
// <script type="text/javascript" src="http://code.jquery.com/jquery-1.4.4.min.js"></script>
// <script type="text/javascript" src="jquery.encapsulating.js"></script>
// <script type="text/javascript">
//    $(function(){
//        $('textarea.foo').encapsulating();
//
//        // you may also specify settings here
//        $('textarea.bar').encapsulating({
//            editTitle: 'click to edit this tag'
//        });
//    });
// </script>
//
// You can also specify settings with data-encapsulating attribute:
//
// <textarea data-encapsulating='{"debug": true}'>
//     first tag, 2nd tag
//     last tag
// </textarea>
//
// }}}


(function($){ // context scope begin

    // == {{{default_settings}}} ==
    var default_settings = {
        // text to display at "delete item" buttom
        removeText: '×',
        // value of "delete item" buttom title attribute
        removeTitle: '',
        // vaue of item title attribute
        editTitle: '',
        // in debug mode, textarea element is visible,
        debug: false
    };



    // == {{{toolbox}}} ==
    // some utility functions
    var toolbox = {

        // === {{{toolbox.transEventKey}}} ===
        // translate event object into easier switchable string
        // e.g. "keypress:shift+meta+97
        transEventKey: function(e) {
            var key = e.type + ':';
            var modifiers = ['alt','shift','ctrl','meta'];
            for (var i in modifiers)
                e[modifiers[i]+'Key'] && (key += modifiers[i]+'+');
            key += e.keyCode;

            return key;
        }, // toolbox.transEventKey

        // === {{{toolbox.cursorAtStart}}} ===
        // checks whether cursor is at the begining of given input
        //
        // Params:
        // * input (DOM or jQuery object)
        cursorAtStart: function(input) {
            if (input instanceof $)
                input = [0];

            if (!input.createTextRange)
            {
                var start = input.selectionStart;
            }
            else
            {
                var r = document.selection.createRange().duplicate();
                r.moveEnd('character', input.value.length);
                if (r.text == '')
                    var start = input.value.length;
                else
                    var start = input.value.lastIndexOf(r.text);
            }
            return 0 == start;
        }, // toolbox.cursorAtStart

        // === {{{toolbox.cursorAtEnd}}} ===
        // checks whether cursor is at the end of given input
        //
        // Params:
        // * input (DOM or jQuery object)
        cursorAtEnd: function(input) {
            if (input instanceof $)
                input = [0];

            if (!input.createTextRange)
            {
                var end = input.selectionEnd;
            }
            else
            {
                var r = document.selection.createRange().duplicate();
                r.moveStart('character', -this.value.length);
                var end = r.text.length;
            }
            return input.value.length == end;
        } // toolbox.cursorAtEnd

    }; // var toolbox



    // == {{{encapsulating}}} ==
    // function called with {{{$(selector).encapsulating()}}},
    // {{{this}}} is a set of matched elements
    $.fn.encapsulating = function(user_settings){

        var invoke_settings = {};

        // merge default and user settings
        $.extend(invoke_settings, default_settings, user_settings);

        return this.each(function(){

            var settings = {};

            // === original textarea ===
            var $textarea = $(this),
                had_focus = false;

            // Snizzle does not support this on IE
            try {
                had_focus = $textarea.is(':focus');
            } catch(e) {}


            // merge-in settings specified in `data-encapsulating` attribute
            $.extend(settings, invoke_settings, $textarea.data('encapsulating'));


            // === textarea replacement ===
            var $area = $('<label />', {
                    width: $textarea.width(),
                    height: $textarea.height(),
                    'class': 'encapsulating-textarea '
                             + $textarea.attr('class')
                             + (settings.debug ? ' debug' : ''),
                    // inherit textarea-specific css properties
                    css: {
                        resize: $textarea.css('resize')
                    }
                })
                // ==== sync encapsulated items to hidden textarea ====
                .bind('syncToTextarea.encapsulating', function(){
                    var $area = $(this);
                    var new_val = [];
                    $area.find('a > .text').each(function(){
                        new_val.push($(this).text());
                    });
                    $textarea.val(new_val.join("\n"));
                }) // syncToTextarea.encapsulating event
                // ==== encapsulate textarea contents ====
                .bind('syncFromTextarea.encapsulating', function(){
                    var $area = $(this);
                    $area.children('a').remove();
                    $area.trigger('push.encapsulating', [$textarea.val().split(/[\n\r,]+/)]);
                }) // syncFromTextarea.encapsulating event
                // ==== encapsulate an item ====
                // Params:
                //  * e (Event): event object
                //  * el (string, array, DOM, jQuery)
                //  ** string to encapsulate
                //  ** DOMor jQuery with input to encapsulate, it will be emptied afterwards and moved at the end of the area
                //  ** array with any of the above
                .bind('push.encapsulating', function(e, el){
                    var $area = $(this);
                    if ($.type(el) == 'string')
                        var val = el;
                    else if ($.type(el) == 'array')
                    {
                        for (var idx in el)
                            $area.trigger('push.encapsulating', [el[idx]]);
                        return;
                    }
                    else
                    {
                        var $el = $(el);
                        switch ($el.length)
                        {
                            case 0:
                                return;
                            case 1:
                                break;
                            default:
                                $el.each(function(){
                                    $area.trigger('push.encapsulating', [this]);
                                });
                                return;
                        }

                        var val = $el.val();
                        $el.val('');
                    }

                    // trim whitespaces
                    val = val.replace(/^\s+|\s+$/g, '');

                    // create new item
                    if (val)
                    {
                        var $item = $('<a />', {
                            href: '#'
                        });

                        $('<span />', {
                            'class': 'text',
                            text: val,
                            title: settings.editLabel
                        }).appendTo($item);

                        $('<span />', {
                            'class': 'remove',
                            text: settings.removeText,
                            title: settings.removeLabel,
                        })
                        .appendTo($item);

                        $item.insertBefore($input);
                    }

                    $input
                        .detach()
                        .width('')
                        .appendTo($area);

                    // scroll to left bottom
                    $area
                        .scrollLeft(0)
                        .scrollTop(2*$area[0].scrollHeight);

                    // update hidden textarea contents
                    $area.trigger('syncToTextarea.encapsulating');
                }); // push.encapsulating event

            // === input field ===
            var $input = $('<input />')
                .data('encapsulating', {})
                // ==== input keypress ====
                .bind('keypress.encapsulating keydown.encapsulating', function(e){
                    var key = toolbox.transEventKey(e);

                    switch (key)
                    {
                        // ===== space =====
                        // drop spaces at the begining of input
                        case 'keypress:32':
                            var $input = $(this);
                            if (!$input.val())
                                e.preventDefault();
                            break;
                        // ===== comma (,), right, tab, enter, escape =====
                        // edit next item
                        case 'keypress:188': // ,
                            e.preventDefault();
                        case 'keydown:39': // right
                            if (!toolbox.cursorAtEnd(this))
                                break;
                        case 'keypress:9': // tab
                        case 'keypress:13': // enter
                        case 'keydown:27': // esc
                            var $input = $(this),
                                $next = $input.next();

                            // tabe key and input was at the end
                            // allow normally focus next item on page
                            if (9 == e.keyCode && !$next.length)
                                break;

                            e.preventDefault();

                            if (27 == e.keyCode)
                                $input.val($input.data('encapsulating').prevVal);

                            if (!$input.val())
                                break;

                            $area.trigger('push.encapsulating', [$input]);

                            // tab or right key and input was not at the end
                            if ($next.length && (e.keyCode == 9 || e.keyCode == 39))
                            {
                                $next.focus();
                            }
                            else
                            {
                                // comma and input was not at the end
                                if ($next.length && key == 188)
                                {
                                    $input
                                        .detach()
                                        .insertBefore($next);
                                }
                                $input.focus();
                            }

                            break;

                        // ===== left, shift+tab, backspace =====
                        // edit previous item
                        case 'keydown:37': // left
                            if (!toolbox.cursorAtStart(this))
                                break;
                        case 'shift9': // shift + tab
                            e.preventDefault();
                            var $input = $(this),
                                $prev = $input.prev();
                            $input.blur();
                            $prev.focus();
                            break;

                        case 'keydown:8': // backspace
                            if (toolbox.cursorAtStart(this))
                            {
                                e.preventDefault();
                                var $input = $(this),
                                    $prev = $input.prev();
                                /*
                                $input.val($prev.text());
                                $prev.remove();
                                */
                                $input.blur();
                                $prev.click();
                            }
                            break;

                    }
                }) // input keypress
                // ==== input focus ====
                // store previous value
                .bind('focus.encapsulating', function(e){
                    var $input = $(this);
                    $input
                        .addClass('focus')
                        .data('encapsulating').prevVal = $input.val();
                }) // input focus
                // ==== input blur ====
                // encapsulate current value
                .bind('blur.encapsulating', function(e){
                    e.preventDefault();
                    var $input = $(this);
                    $input.removeClass('focus');
                    $area.trigger('push.encapsulating', [$input]);

                }); // input blur

            // === place in DOM ===
            if (settings.debug)
                $textarea.css('opacity', .5);
            else
                $textarea.hide();
            $textarea.bind('change', function(e){
                $area.trigger('syncFromTextarea.encapsulating');
            });
            $area.insertAfter($textarea);
            $input.appendTo($area);

            // === encapsulated item ===
            // bind events to all future created items

            $('a', $area[0])
                // ==== encapsulated item edit ====
                .live('click.encapsulating edit.encapsulating', function(e){
                    e.preventDefault();
                    var $this = $(this);
                    $input
                            .detach()
                            .width($this.width())
                            .val($this.children('.text').text())
                            .insertAfter($this)
                            .focus();
                    if ($.browser.msie)
                    {
                        // HACK apparently IE really needs to focus
                        $input.focus();
                    }
                    $this.remove();
                }) // a edit
                // ==== encapsulating item keypress ====
                .live('keypress.encapsulating keydown.encapsulating', function(e){
                    var key = toolbox.transEventKey(e);

                    switch (key)
                    {
                        case 'keypress:shift+9': // shift+8
                        case 'keydown:37': // left
                            e.preventDefault();
                            $(this).prev().focus();
                            break;
                        case 'keypress:9': // tab
                        case 'keydown:39': // right
                            e.preventDefault();
                            $(this).next().focus();
                            break;
                        case 'keydown:113': // F2
                            e.preventDefault();
                            $(this).click();
                            break;
                        case 'keydown:8': // backspace
                        case 'keydown:46': // del
                            e.preventDefault();
                            $(this)
                                .next()
                                    .focus()
                                .end()
                                .remove();
                    }
                }); // a keypress

            // ==== encapsulated item remove ====
            $('a > .remove', $area[0])
                .live('click.encapsulating', function(e){
                    e.preventDefault();
                    var $item = $(this).parent();
                    $item.remove();
                    $area.trigger('syncToTextarea.encapsulating');
                    return false;
                }); // a > .remove click

            // === encapsulate existing textarea contents ===
            $area.trigger('syncFromTextarea.encapsulating');

            // === focus input field ===
            // if textarea had focus
            if (had_focus)
                $input.focus();

        }); // return each this

    }; // $.fn.encapsulating

})(jQuery); // context scope end

