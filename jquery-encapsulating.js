// = encapsulating textarea, jQuery plugin =
// * author: Marek `saji' Augustynowicz
// * license: MIT (LICENSE.md file should be distributed with the code)
// * http://github.com/marek-saji/jquery-encapsulating
//
// USAGE:
// {{{
// <link rel="stylesheet" type="text/cxx" href="jquery-encapsulating.css" />
// <script type="text/javascript" src="http://code.jquery.com/jquery-1.4.4.min.js"></script>
// <script type="text/javascript" src="jquery-encapsulating.js"></script>
// <script type="text/javascript">
//    $(function(){
//        $('textarea').encapsulating();
//    });
// </script>
// }}}
//
// TODO
// * clean up
// * bind keys:
//   * on input:
//     * left and right

(function(){ // context scope begin

    // == {{{encapsulating}}} ==
    // function called with $(selector).encapsulating(),
    // {{{this}}} is set of matched elements
    jQuery.fn.encapsulating = function(user_settings){

        var settings = {},
            default_settings = {
                'debug': false
            };

        jQuery.extend(settings, default_settings, user_settings);

        this.each(function(){

            // === original textarea ===
            var $textarea = $(this),
                had_focus = $textarea.is(':focus');

            // === create textarea replacement ===
            var $area = $('<label />', {
                    width: $textarea.width(),
                    height: $textarea.height(),
                    'class': 'encapsulating-textarea '
                             + $textarea.attr('class'),
                    // inherit textarea-specific css properties
                    'css': {
                        resize: $textarea.css('resize')
                    }
                })
                .data('encapsulating', {textarea: $textarea})
                // ==== sync encapsulated items to hidden textarea ====
                .bind('encapsulating.syncToTextarea', function(){
                    var $area = $(this);
                    var $textarea = $area.data('encapsulating').textarea;
                    var new_val = [];
                    $area.children('a').each(function(){
                        new_val.push($(this).text());
                    });
                    $textarea.val(new_val.join("\n"));
                }) // encapsulating.syncToTextarea event
                // ==== encapsulate textarea contents ====
                .bind('encapsulating.syncFromTextarea', function(){
                    var $area = $(this);
                    var $textarea = $area.data('encapsulating').textarea;
                    $area.children('a').remove();
                    $area.trigger('encapsulating.push', [$textarea.val().split(/[\n\r,]+/)]);
                }) // encapsulating.syncFromTextarea event
                // ==== encapsulate an item ====
                // Params:
                //  * {{{event e}}}: event object
                //  * {{{string|DOM|jQuery|array el}}}:
                //    * {{{string}}} to encapsulate
                //    * {{{DOM}}} or {{{jQuery}}} with input to encapsulate,
                //      it will be emptied afterwards and moved at the
                //      end of the area
                //    * {{{array}}} with any of the above
                .bind('encapsulating.push', function(e, el){
                    var $area = $(this);
                    if (jQuery.type(el) == 'string')
                        var val = el;
                    else if (jQuery.type(el) == 'array')
                    {
                        for (var idx in el)
                            $area.trigger('encapsulating.push', [el[idx]]);
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
                                    $area.trigger('encapsulating.push', [this]);
                                });
                                return;
                        }

                        var val = $el.val();
                        $el.val('');
                    }

                    // trim whitespaces
                    val = val.replace(/^\s+|\s+$/g, '');

                    var $input = $area.data('encapsulating').input;

                    // create new item
                    if (val)
                    {
                        $('<a />', {
                                text: val,
                                href: '#'
                            })
                        .data('encapsulating', {area: $area, input: $input})
                            .insertBefore($input);
                    }

                    $input
                        .detach()
                        .width('auto')
                        .appendTo($area);

                    // scroll to left bottom
                    $area
                        .scrollLeft(0)
                        .scrollTop(2*$area[0].scrollHeight);

                    // update hidden textarea contents
                    $area.trigger('encapsulating.syncToTextarea');
                }); // encapsulating.push event

            // === create input field ===
            var $input = $('<input />')
                .data('encapsulating', {area: $area})
                // ==== input keydown ====
                .keydown(function(e){
                    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey)
                        return;

                    switch (e.keyCode)
                    {
                        // ===== space =====
                        // drop spaces at the begining of input
                        case 32:
                            var $input = $(this);
                            if (!$input.val())
                                e.preventDefault();
                            break;
                        // ===== comma (,), tab, enter, right =====
                        // encapsulate new item
                        case 188: // ,
                            e.preventDefault();
                        case 39: // right
                            if (!this.isAtEnd())
                                break;
                        case 9: // tab
                        case 13: // enter
                            var $input = $(this);
                            if ($input.val())
                            {
                                e.preventDefault();
                                var $next = $input.next();
                                $input.data('encapsulating').area
                                    .trigger('encapsulating.push', [$input]);
                                // tab key and input was not at the end
                                if ($next.length && (e.keyCode == 9 || e.keyCode == 39))
                                {
                                    $next.focus();
                                }
                                else
                                {
                                    // comma and input was not at the end
                                    if ($next.length && e.keyCode == 188)
                                    {
                                        $input
                                            .detach()
                                            .insertBefore($next);
                                    }
                                    $input.focus();
                                }
                            }
                            break;

                        // ===== backspace, left =====
                        // when input is empty, start editing
                        // previous item
                        case 37: // left
                            if (this.isAtStart())
                            {
                                e.preventDefault();
                                var $input = $(this),
                                    $prev = $input.prev();
                                $input.blur();
                                $prev.focus();
                            }
                            break;

                        case 8: // backspace
                            if (this.isAtStart())
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

                        default:
                            if (settings.debug)
                            {
                                console.log('keyCode:', e.keyCode);
                            }
                    }
                }) // input keydown
                // ==== input blur ====
                // encapsulate current value
                .blur(function(e){
                    e.preventDefault();
                    var $input = $(this);
                    $input.data('encapsulating').area
                        .trigger('encapsulating.push', [$input]);

                }); // input blur

            $input[0].isAtStart = function(){
                if (!this.createTextRange)
                {
                    var start = this.selectionStart;
                }
                else
                {
                    var r = document.selection.createRange().duplicat();
                    r.moveEnd('character', this.value.length);
                    if (r.text == '')
                        var start = this.value.length;
                    else
                        var start = this.value.lastIndexOf(r.text);
                }
                return 0 == start;
            }; // input.isAtStart

            $input[0].isAtEnd = function(){
                if (!this.createTextRange)
                {
                    var end = this.selectionEnd;
                }
                else
                {
                    var r = document.selection.createRange().duplicate();
                    r.moveStart('character', -this.value.length);
                    var end = r.text.length;
                }
                return this.value.length == end;
            }; // input.isAtEnd

            $area.data('encapsulating').input = $input;

            // === place in DOM ===
            if (settings.debug)
                $textarea.css('opacity', .5);
            else
                $textarea.hide();
            $area.insertAfter($textarea);
            $input.appendTo($area);

            // === encapsulated item ===
            // bind events to all future created items
            $('a', $area[0])
                // ==== encapsulated item edit ====
                .live('click encapsulating.edit', function(e){
                    e.preventDefault();
                    var $this = $(this);
                    $this
                        .data('encapsulating').input
                            .detach()
                            .width($this.width())
                            .val($this.text())
                            .insertAfter($this)
                            .focus();
                    $this.remove();
                }) // a edit
                // ==== encapsulated item keydown ====
                .live('keydown', function(e){
                    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey)
                        return;
                    switch (e.keyCode)
                    {
                        case 37: // left
                            $(this).prev().focus();
                            break;
                        case 39: // right
                            $(this).next().focus();
                            break;
                        case 113: // F2
                            e.preventDefault();
                            $(this).click();
                            break;
                        case 8: // backspace
                        case 46: // del
                            $(this)
                                .next()
                                    .focus()
                                .end()
                                .remove();
                    }
                }); // a keydown

            // === encapsulate existing textarea contents ===
            $area.trigger('encapsulating.syncFromTextarea');

            // === focus input field ===
            // if textarea had focus
            if (had_focus)
                $input.focus();

        }); // each this
    }; // jQuery.fn.encapsulating

})(); // context scope end
