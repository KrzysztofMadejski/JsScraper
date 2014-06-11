// zbierz i pokoloruj klasy
classes = {};
elements = {};
select_tools = {
  div: null,
  targeted: null,
  t_class: false,
  t_position: false,
  t_align: false
};

function target_in(el) {
    // clean
    $('*').removeClass('targeted');

    // remember
    select_tools.targeted = el;
    jel = $(el);

    // act
    jel.addClass('targeted');
    if (select_tools.t_class && jel.attr('class')) {
        shared_classes = jel.attr('class').split(/\s+/).map(function(cl) { return '.' + cl}).join(',');
        $(shared_classes).addClass('targeted');
    }
}

function refresh_target_options() {
    target_in(select_tools.targeted);
}

function target_out() {
    select_tools.targeted = null;

    $('*').removeClass('targeted');
}

function target_align(ev) {
    key = ev.which;
//
//   refresh_target_options
//
}

function target_position(ev) {
    key = ev.which;

}

function target_class(ev) {
    select_tools.t_class = !select_tools.t_class;
    refresh_target_options();
}

function randi(max) {
    return Math.floor(Math.random() * (max+1))
}

function rand_color(opacity) {
    return 'hsla(' + randi(360) + ','
        + '100%,'
        + (20 + randi(50)) + '%,'
        + opacity + ')';
}

function analyze_elements() {
    $('*').each(function (idx, el) {
        tag = $(el).prop('tagName');
        if ($(el).attr('class') !== undefined)
            $(el).attr('class').split(/\s+/).forEach(function (cl) {
                if (classes[cl] === undefined)
                    classes[cl] = {};
                if (elements[tag] === undefined)
                    elements[tag] = {};

                classes[cl][tag] = 1;
                elements[tag][cl] = 1;
            });
    });

    // color classes
    for(cl in classes) {
        $('.' + cl).css('background-color', rand_color(0.3));
    }

    $('body').find('*').hover(function() { target_in(this); }, target_out);

    select_tools = $('<div id="select-tools">' +
        '' +
        '</div>');
    $('body').append(select_tools);
}

$(function () {
    $(document).bind('keydown.JsScraper', function (e) {
        if (e.which == KeyEvent.DOM_VK_P) {
            analyze_elements();

        } else if ($.inArray(e.which, [KeyEvent.DOM_VK_W, KeyEvent.DOM_VK_S, KeyEvent.DOM_VK_A, KeyEvent.DOM_VK_D]) != -1) {
            if (e.shiftKey) {
                target_align(e);

            } else {
                target_position(e);
            }
        } else if (e.which == KeyEvent.DOM_VK_Q) {
            target_class(e);
        }
    });
});

