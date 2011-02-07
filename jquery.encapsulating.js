// = encapsulating textarea, jQuery plugin =
//
// * author: Marek 'saji' Augustynowicz
// * license: MIT (LICENSE.md file should be distributed with the code)
// * http://github.com/marek-saji/jquery.encapsulating
//
// == USAGE ==
// {{{
// <link rel="stylesheet" type="text/css" href="jquery.encapsulating.css" />
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
        // Text to display at button that deletes an item.
        removeText: '×',
        // Value of title attribute of a button that deletes an item.
        removeTitle: '',
        // Value of item title attribute.
        editTitle: '',
        // When debug is enabled, original textarea element is visible.
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

        // === {{{toolbox.selectionPosition}}} ===
        // checks position of selection in given input
        //
        // Params
        // * input (DOM or jQuery object)
        //
        // Returns object with `start`, `end` and `length`
        selectionPosition: function(input) {
            if (input instanceof $)
                input = input[0];

            var position = {
                start: undefined,
                end: undefined,
                atStart: false,
                atEnd: false,
                length: undefined
            };

            if (!input.createTextRange)
            {
                position.start = input.selectionStart;
                position.end = input.selectionEnd;
            }
            else // IE
            {
                var bm = document.selection.createRange().getBookmark(),
                    s  = input.createTextRange(),
                    s2 = input.createTextRange();

                s.moveToBookmark(bm);
                s2.collapse(true);
                s2.setEndPoint("EndToStart", s);

                position.start = s2.text.length;
                position.end = position.start + s.text.length;
            }
            position.length = position.end - position.start;

            if (0 == position.length)
            {
                position.atStart = 0 == position.start;
                position.atEnd = input.value.length == position.end;
            }

            return position;
        }, // toolbox.selectionPosition

        // === {{{toolbox.focus}}} ====
        // on non-problematic browsers, just focus
        //
        // Params:
        // * $el (jQuery)
        focus: function($el, $blur_el) {
            if (typeof $blur_el != 'undefined')
                $blur_el.blur();

            if ($el.is('.encapsulating_input_wrapper'))
                $el = $input;

           if (!$.browser.msie && !$.browser.opera)
               $el.focus();
           else
           {
               // HACK apparently IE really needs to focus
               setTimeout(function(){ $el.focus(); }, 10);
           }
        } // toolbox.focus

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
                        "resize": $textarea.css('resize'),
                        "-moz-resize": $textarea.css('-moz-resize')
                    }
                })
                .data('encapsulating', {})
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
                            title: settings.removeLabel
                        })
                        .appendTo($item);

                        $item.insertBefore($input_wrapper);
                    }

                    $input_wrapper
                        .detach()
                        .appendTo($area);

                    // scroll to left bottom
                    $area
                        .scrollLeft(0)
                        .scrollTop(2*$area[0].scrollHeight);

                    // update hidden textarea contents
                    $area.trigger('syncToTextarea.encapsulating');
                }); // push.encapsulating event

            // === input field ===
            var $input_wrapper = $('<div />', {
                    'class': 'encapsulating_input_wrapper'
                }),
                $input_sizer = $('<span />', {
                    'class': 'encapsulating_input_sizer'
                }),
                $input = $('<input />',{
                    'size': 1
                })
                .data('encapsulating', {})
                // ==== input keypress ====
                .bind('keypress.encapsulating keydown.encapsulating', function(e){
                    var key = toolbox.transEventKey(e),
                        $input = $(this);

                    if (settings.debug)
                        console.log('encapsulating:', 'input', key);

                    switch (key)
                    {
                        // ===== space =====
                        // drop spaces at the begining of input
                        case 'keypress:32':
                            if (!$input.val())
                                e.preventDefault();
                            break;
                        // ===== comma (,), right, tab, enter, escape =====
                        // edit next item
                        case 'keydown:188': // ,
                            e.preventDefault();
                        case 'keydown:39': // right
                            if (!toolbox.selectionPosition($input).atEnd)
                                break;
                        case 'keydown:9': // tab (only for IE and Opera)
                        case 'keypress:13': // enter
                        case 'keydown:27': // esc
                            if (9 == e.keyCode && !$.browser.msie && !$.browser.opera)
                                break;

                            var $next = $input_wrapper.next();

                            // tab key and input was at the end
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
                                toolbox.focus($next, $input);
                            }
                            else
                            {
                                // comma and input was not at the end
                                if ($next.length && key == 188)
                                {
                                    $input_wrapper
                                        .detach()
                                        .insertBefore($next);
                                }
                                toolbox.focus($input);
                            }

                            break;

                        // ===== left, shift+tab, backspace =====
                        // edit previous item
                        case 'keydown:37': // left
                            if (!toolbox.selectionPosition(this).atStart)
                                break;
                        case 'keydown:shift+9': // shift+tab (only for IE and Opera)
                            if (9 == e.keyCode && !$.browser.msie && !$.browser.opera)
                                break;

                            e.preventDefault();
                            var $prev = $input_wrapper.prev();
                            toolbox.focus($prev, $input);
                            break;

                        case 'keydown:8': // backspace
                            if (toolbox.selectionPosition(this).atStart)
                            {
                                e.preventDefault();
                                var $prev = $input_wrapper.prev();
                                /*
                                $input.val($prev.text());
                                $prev.remove();
                                */
                                $input.blur();
                                $prev.click();
                            }
                            break;

                    }
                    $input_sizer.text($input.val()+'#jF');
                }) // input keypress
                .bind('keyup.encapsulating', function(e){
                    $input_sizer.text($input.val()+'#jF');
                }) // input keyup
                // ==== input focus ====
                // store previous value
                .bind('focus.encapsulating', function(e){
                    if (settings.debug)
                        console.log('encapsulating:', 'input', e.type);
                    var $input = $(this);
                    $input_sizer.text($input.val()+'#jF');
                    $input
                        .addClass('focus')
                        .data('encapsulating').prevVal = $input.val();
                }) // input focus
                // ==== input blur ====
                // encapsulate current value
                .bind('blur.encapsulating', function(e){
                    if (settings.debug)
                        console.log('encapsulating:', 'input', e.type);
                    e.preventDefault();
                    var $input = $(this);
                    $input.removeClass('focus');
                    $area.trigger('push.encapsulating', [$input]);
                    $input_sizer.text($input.val()+'#jF');

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
            $input_wrapper.appendTo($area);
            $input_sizer.add($input).appendTo($input_wrapper);

            // === encapsulated item ===
            // bind events to all future created items

            if (settings.debug)
            {
                $('a', $area[0]).live('focus.encapsulated blur.encapsulated', function(e){
                    console.log('encapsulating:', 'item', e.type, $(this).children('.text').text());
                });
            }

            $('a', $area[0])
                // ==== encapsulated item edit ====
                .live('click.encapsulating edit.encapsulating', function(e){
                    e.preventDefault();
                    var $this = $(this);
                    $input_wrapper.detach();
                    $input.val($this.children('.text').text());
                    $input_wrapper.insertAfter($this);
                    $input.focus();
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
                        case 'keypress:shift+9': // shift+tab
                        case 'keydown:37': // left
                            e.preventDefault();
                            var $prev = $(this).prev();
                            if ($prev.is('.encapsulating_input_wrapper'))
                                $input.focus();
                            else
                                $prev.focus();
                            break;
                        case 'keypress:9': // tab
                        case 'keydown:39': // right
                            e.preventDefault();
                            var $next = $(this).next();
                            if ($next.is('.encapsulating_input_wrapper'))
                                $input.focus();
                            else
                                $next.focus();
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

            $('*', $area[0])
                .live('focus', function(e){
                    clearTimeout($area.data('encapsulating').focusTimeout);
                    $area.addClass('focus');
                })
                .live('blur', function(e){
                    $area.data('encapsulating').focusTimeout = setTimeout(function(){
                        $area.removeClass('focus');
                    }, 100);
                });

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
            $area
                .trigger('syncFromTextarea.encapsulating')
                .scrollLeft(0)
                .scrollTop(0);

            // === focus input field ===
            // if textarea had focus
            if (had_focus)
                $input.focus();

        }); // return each this

    }; // $.fn.encapsulating

})(jQuery); // context scope end

