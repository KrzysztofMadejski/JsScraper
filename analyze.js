// zbierz i pokoloruj klasy
classes = {};
elements = {};
select_tools = {
  div: {
      pmask_south: null,
      tools: null
  },
  targeted: null,
  t_class: true,
  t_position: false,
  t_align: false
};
body_width = null;
body_height = null;
currentMousePos = { x: -1, y: -1 };

data_structure = {
  object: {
      text: 'biuro',
      money: 'kwota',
      dzialanosc: ''
  }
};

data = {
    'biuro': 'BIuro xxx',
    'kwota': '2754.2'
};

function tag_elements(targeted) {
    p = select_tools.div.tools;

    p.find('input[name="tagName"]')[0].value = $('.targeted-primary').attr('class').split(/\s+/)[0];
    p.css('top', body_height / 2);
    p.css('left', body_width / 2);

    p.toggle();

    // TODO add to datastructure

    $('.targeted').addClass('processed');
    target_out();
}

function target_in(el) {
    jel = $(el);

    // clean
    $('*').removeClass('targeted targeted-primary');

    if (jel.hasClass('processed')) {
        return;
    }

    // remember
    select_tools.targeted = el;

    // act
    jel.addClass('targeted targeted-primary');
    if (select_tools.t_class && jel.attr('class')) {
        shared_classes = jel.attr('class').split(/\s+/).map(function(cl) { return '.' + cl + ':not(.processed)'}).join(',');
        $(shared_classes).addClass('targeted');
    }
}

function refresh_target_options() {
    target_in(select_tools.targeted);
}

function target_out() {
    select_tools.targeted = null;

    $('*').removeClass('targeted targeted-primary');
}

function target_align(ev) {
    key = ev.which;
//
//   refresh_target_options
//
}

function target_position(ev) {
    key = ev.which;

    // TODO tylko ustawienie maski, renderowanie gdzie indziej

    if (key == KeyEvent.DOM_VK_W) {
        m = select_tools.div.pmask_south;
        m.css('top', currentMousePos.y);
        select_tools.pmask_south = currentMousePos.y; // TODO toggle
        m.toggle();

    } else if (key == KeyEvent.DOM_VK_S) {
        m = select_tools.div.pmask_north;
        m.css('top', -body_height + currentMousePos.y);
        m.toggle();

    } else if (key == KeyEvent.DOM_VK_A) {
        m = select_tools.div.pmask_east;
        m.css('left', currentMousePos.x);
        m.toggle();

    } else if (key == KeyEvent.DOM_VK_D) {
        m = select_tools.div.pmask_west;
        m.css('left', -body_width + currentMousePos.x);
        m.toggle();

    }
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
                if (cl.trim().length == 0 || cl == 'targeted' || cl == 'targeted-primary')
                    return;

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

    body_width = $('body').width();
    body_height = $('body').height();

    select_tools.div.tools = $('<div id="select-tools" style="display:none;">' +
        'Nazwa tagu: <input name="tagName"/>' +
        '</div>');
    select_tools.div.pmask_south = $('<div id="pmask-south" style="display: none"></div>');
    select_tools.div.pmask_north = $('<div id="pmask-north" style="display: none"></div>');
    select_tools.div.pmask_east = $('<div id="pmask-east" style="display: none"></div>');
    select_tools.div.pmask_west = $('<div id="pmask-west" style="display: none"></div>');
    select_tools.div.pmask_north.css('height', body_height);
    select_tools.div.pmask_south.css('height', body_height);
    select_tools.div.pmask_east.css('width', body_width);
    select_tools.div.pmask_west.css('width', body_width);

    for (key in select_tools.div) {
        $('body').append(select_tools.div[key]);
    }

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
    }).bind('click.JsScraper', function () {
        targeted = $('.targeted');
        if (targeted.size() == 0)
            return;

        tag_elements(targeted);
    }).mousemove(function(event) {
        currentMousePos.x = event.pageX;
        currentMousePos.y = event.pageY;
    });

    analyze_elements();
});

