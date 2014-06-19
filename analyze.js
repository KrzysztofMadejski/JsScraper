// zbierz i pokoloruj klasy
classes = {};
elements = {};
select_tools = {
  mask_div: {},
  div: {
      pmask_south: null,
      tools: null
  },
  targeted: null,
  t_class: true,
  f_classes: null,
  t_sameline: false,
};

filters = {
  f_classes: null,
  pmask_south: null,
  pmask_north: null,
  pmask_west: null,
  pmask_east: null,     
};

body_width = null;
body_height = null;
currentMousePos = { x: -1, y: -1 };

original_page_num = null;
page_num = null;

data_structure = {
  object: {
      text: 'biuro',
      money: 'kwota',
      dzialanosc: ''
  }
};

tags = [];	

jsc_class_prefix = 'jsc-';
line_buff = 3;

function _sort_LR(a, b) {	
	if (parseToPixels($(a).css('top')) <= parseToPixels($(b).css('top')) - line_buff) {
		return -1;
	} else if (parseToPixels($(a).css('top')) - line_buff >= parseToPixels($(b).css('top'))) {
		return 1;
	}
	return parseToPixels($(a).css('left')) - parseToPixels($(b).css('left'));
}

function _append_data_row(table, curr_row) {
	table.append($('<tr>' + tags.filter(function(tagdef) {
		return !tagdef.ignore;
	}).map(function(tagobj) { 
		return '<td>' + (curr_row[tagobj.name] == null ? '' : curr_row[tagobj.name])  + '</td>';
	}).join('') + '</tr>'));
}

function process_range() {
    // "process next" na razie
    page_num += 1;
    next_page = window.location.href.replace(/\-\d+\.html$/, '-' + page_num + '.html');

    $('#page' + original_page_num + '-div').load(next_page + ' #page' + page_num + '-div > *');
}

function sort_and_prepare_data() {
	// 3px buffer
	sorted = $('p').sort(_sort_LR);
	
	table = $('#data table');
	table.empty();
	table.append(header = $('<tr></tr>'));
	
	$.each(tags.filter(function(tagdef) {
		return !tagdef.ignore;
	}), function(idx, tag) {
		header.append($('<th>' + tag.name + '</th>'));
	});
	
	$('#data').show();
	
	last_tag = null;
	curr_row = {};
	row = {};
	sorted.each(function(idx, el) {
		tag = $(el).attr('class').split(/\s+/).filter(function(cl) {
			return cl.indexOf(jsc_class_prefix + 'tag-') == 0;
		});
		if (tag.length > 0) {
			tag = tag[0].substr((jsc_class_prefix + 'tag-').length);
			
			if (tag != last_tag) {
				if (curr_row[tag] != null) {
					// this field was filled before so start a new row
					_append_data_row(table, curr_row);
					
					curr_row = {};
				}
				curr_row[tag] = $(el).text();
				
			} else {
				// append text to last_tag (TODO sometimes[ie empty sections] this may be wrong behavior, TODO glueing rules)
				curr_row[tag] = curr_row[tag] + ' ' + $(el).text(); 
			}
			last_tag = tag;
		}
	});
	
	// last_row
	if (tags.some(function(tagdef){ return curr_row[tagdef.name] != null; })) {
		_append_data_row(table, curr_row);
	}
	
	// show rules
	$('#rules').text(JSON.stringify(tags));
}

function filters_enabled() {
	if (select_tools.cache_classes && select_tools.t_class) {
		filters.f_classes = select_tools.cache_classes;
		return true;
	
	} else {
		filters.f_classes = null;
	}

	for (f in filters) {
		if (filters[f]) 
			return true;
	}
	return false;
}

function reset_filters() {
	for (f in filters) {
		filters[f] = null;
	}
	highlight_targeted();
}

function highlight_targeted() {
    // clean
    $('body p').removeClass('jsc-targeted jsc-targeted-primary');
	for (mask_key in select_tools.mask_div) {
		select_tools.mask_div[mask_key].hide();
	}
	
	// no filters - don't highlight
	if (!filters_enabled()) {
		return;
	}	
	selector = base_selector = 'p:not(.jsc-processed):not(.jsc-elem)'
	
	// classes
    if (select_tools.t_class && filters.f_classes && filters.f_classes.length > 0) {
		selector = filters.f_classes.map(function(cl) { 
			return 'p.' + cl + ':not(.jsc-processed):not(.jsc-elem)';
		}).join(',');
    
	} 
	candidates = $('body').find(selector);
	
	// filter by position masks	
	candidates = candidates.filter(function(idx, el) { //jquery filter
		// now we always treat masks inclusive
		el = $(el);
		if (filters.pmask_south != null && parseToPixels(el.css('top')) > filters.pmask_south)
			return false;	
		
		if (filters.pmask_north != null && parseToPixels(el.css('top')) + el.height() < filters.pmask_north)
			return false;
			
		if (filters.pmask_east != null && parseToPixels(el.css('left')) > filters.pmask_east)
			return false;
			
		if (filters.pmask_west != null && parseToPixels(el.css('left')) + el.width() < filters.pmask_west)
			return false;
			
		return true;
	});
	
	// HIGHLIGHT ELEMENTS
	candidates.addClass('jsc-targeted');
	
	// compute end-of-line rule 
	// TODO does end-of-line takes into account class or not?
	if (select_tools.t_sameline) {
		candidates.each(function(idx, c) {
			$(base_selector).each(function(idx, p) {
				if (Math.abs(parseToPixels($(c).css('top')) - parseToPixels($(p).css('top'))) <= line_buff) {
					$(p).addClass(jsc_class_prefix + 'targeted');
				}
			});
		});
	}
	
	// RENDER MASKS
	if (filters.pmask_south) {
		m = select_tools.mask_div.pmask_south;
        m.css('top', filters.pmask_south);
        m.toggle();		
    }
	
	if (filters.pmask_north) {
		m = select_tools.mask_div.pmask_north;
        m.css('top', -body_height + filters.pmask_north);
        m.toggle();     
    } 
	
	if (filters.pmask_east) {
		m = select_tools.mask_div.pmask_east;
        m.css('left', filters.pmask_east);
        m.toggle();
    } 
	
	if (filters.pmask_west) {
		m = select_tools.mask_div.pmask_west;
        m.css('left', -body_width + filters.pmask_west);
        m.toggle();
    }   
}

function parseToPixels($pos) {
	if (/px$/.test($pos)) {
		return parseInt($pos);
	} else if ($pos == 'auto') {
		return null;
	}
	throw "parseToPixels unimplemented: " + $pos; 
}

function tag_elements(targeted) {
	if (!filters_enabled()) {
		return;
	}

    p = select_tools.div.tools;

    p.find('input[name="tagName"]')[0].value = $($('.jsc-targeted')[0]).text();
    p.css('top', currentMousePos.y + 10);
    p.css('left', currentMousePos.x + 10);

    p.toggle();
	select_tools.panel_add_tag = true;
	
    // TODO add to datastructure

    //$('.targeted').addClass('processed');
    //hover_out();
}

function addTagHandler() {
	filters_copy = $.extend({
		t_sameline: select_tools.t_sameline
	}, filters);
	
	ignoreTag = this.id == 'ignoreTag';
	if (this.id == 'addNewTag' || this.id == 'ignoreTag') {
		tagName = $('#select-tools input[name="tagName"]').val();
		// TODO validate tagName
		
		tags.push({			
			name: (ignoreTag ? 'ignore-' : '') + tagName,
			ignore: ignoreTag,
			filters: [filters_copy]
		});
		
	} else if (this.id == 'useExistingTag') {
		if (tags.length == 0)
			return;
			
		tagName = $('#select-tools select[name="existingTag"]').val();
		for(i=0; i<tags.length;i++) {
			if (tags[i].name == tagName) {
				tags[i].filters.push(filters_copy);
				break;
			}
		}
	} else if (this.id == 'cancel') {
		select_tools.panel_add_tag = false;
		select_tools.div.tools.toggle();
		return;
	}
	
	if (ignoreTag) {
		$('.jsc-targeted').addClass(jsc_class_prefix + 'ignore-' + tagName);	
	} else {
		$('.jsc-targeted').addClass(jsc_class_prefix + 'tag-' + tagName);	
	}	
	
	// update select
	select = $('#select-tools select[name="existingTag"]');
	select.empty();
	$.each(tags, function(idx, t) {
		select.append($('<option></option>').attr("value", t.name).text(t.name));
	});
	
	// mark elements as processed
	$('.jsc-targeted').addClass('jsc-processed');
	
	// hide panel, rerender
	select_tools.panel_add_tag = false;
	select_tools.div.tools.toggle();
	
	reset_filters(); // TODO cache_classes ?
	sort_and_prepare_data();
}

function on_mouseenter() {
	if (select_tools.panel_add_tag) {
		return;
	}
	
	jel = $(this);
	
	// remember classes
	if (jel.attr('class')) {
		select_tools.cache_classes = jel.attr('class').split(/\s+/).filter(function(cl) {
			return cl.indexOf(jsc_class_prefix) != 0;
		});
	}
	
    highlight_targeted();
}

function on_mouseleave() {
	if (select_tools.panel_add_tag) {
		return;
	}
	select_tools.cache_classes = null;

	highlight_targeted();
}

function target_align(ev) {
    key = ev.which;
}

function target_position(ev) {
    key = ev.which;

	// save filter
    if (key == KeyEvent.DOM_VK_W) {
		filters.pmask_south = (filters.pmask_south == null) ? currentMousePos.y : null;
		
    } else if (key == KeyEvent.DOM_VK_S) {
		filters.pmask_north = (filters.pmask_north == null) ? currentMousePos.y : null;
		
    } else if (key == KeyEvent.DOM_VK_A) {
		filters.pmask_east = (filters.pmask_east == null) ? currentMousePos.x : null;
		
    } else if (key == KeyEvent.DOM_VK_D) {
		filters.pmask_west = (filters.pmask_west == null) ? currentMousePos.x : null;
    }   
	
	highlight_targeted();
}

function target_class(ev) {
	if (select_tools.t_class) {
		select_tools.t_class = false;
		filters.f_classes = null;
	
	} else {
		select_tools.t_class = true;
	}
	
	highlight_targeted();	
}

function target_sameline(ev) {
	select_tools.t_sameline = !select_tools.t_sameline;
	
	highlight_targeted();
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
	
	// clear margins so offsets are accurate
	$('body').css('margin', '0px').css('padding', '0px').css('border', 'none');	
	
    // color classes
    for(cl in classes) {
        $('.' + cl).css('background-color', rand_color(0.3));
    }

	$(document).on('mouseenter', 'body p:not(.jsc-processed)', on_mouseenter);
	$(document).on('mouseleave', 'body p', on_mouseleave);
	
    body_width = $('body').width();
    body_height = $('body').height();

    // TODO
	page = $('#page159-div');

    page_num = /\-\d+\.html$/.exec(window.location.href)[0];
    original_page_num = page_num = parseInt(page_num.substr(1, page_num.length - 6));

    select_tools.div.tools = $('<div id="select-tools" class="jsc-elem" style="display:none;">' +
        'Add new: <input name="tagName"/> <input id="addNewTag" type="submit" value="Dodaj"/><input id="ignoreTag" type="submit" value="Ignore"/></br>' +
		'or use existing: <select name="existingTag"></select><input id="useExistingTag" type="submit" value="Dodaj"/></br>' +
		 '<input id="cancel" type="submit" value="Cancel"/>' +
        '</div>');
	select_tools.div.data = $('<div id="data" class="jsc-elem" style="display: none;">Data:<table></table><div>Rules:</div><textarea id="rules"></textarea></div>');
	select_tools.div.data.css('left', page.width() + 20);
	
    select_tools.mask_div.pmask_south = $('<div id="pmask-south" class="jsc-elem" style="display: none"></div>');
    select_tools.mask_div.pmask_north = $('<div id="pmask-north" class="jsc-elem" style="display: none"></div>');
    select_tools.mask_div.pmask_east = $('<div id="pmask-east" class="jsc-elem" style="display: none"></div>');
    select_tools.mask_div.pmask_west = $('<div id="pmask-west" class="jsc-elem" style="display: none"></div>');
    select_tools.mask_div.pmask_north.css('height', body_height);
    select_tools.mask_div.pmask_south.css('height', body_height);
    select_tools.mask_div.pmask_east.css('width', body_width);
    select_tools.mask_div.pmask_west.css('width', body_width);

	for (key in select_tools.div) {
		$('body').append(select_tools.div[key]);
	}
    for (key in select_tools.mask_div) {
        $('body').append(select_tools.mask_div[key]);
    }

	$(document).on('click', '#select-tools input[type="submit"]', addTagHandler);
}

$(function () {
    $(document).bind('keydown.JsScraper', function (e) {	
		if (select_tools.panel_add_tag) {
			return;
		}
		
        if (e.which == KeyEvent.DOM_VK_P) {
            sort_and_prepare_data();

        } else if ($.inArray(e.which, [KeyEvent.DOM_VK_W, KeyEvent.DOM_VK_S, KeyEvent.DOM_VK_A, KeyEvent.DOM_VK_D]) != -1) {
            if (e.shiftKey) {
                target_align(e);

            } else {
                target_position(e);
            }
        } else if (e.which == KeyEvent.DOM_VK_Q) {
            target_class(e);
			
        } else if (e.which == KeyEvent.DOM_VK_E) {
            target_sameline(e);
			
        } else if (e.which == KeyEvent.DOM_VK_O) {
            process_range();

        } else if (e.which == KeyEvent.DOM_VK_H) {
            highlight_targeted();

        } else if (e.which == KeyEvent.DOM_VK_I) {
			$('img').toggle();
			$('body').css('background-color', 'white');
		}
    }).on('click.JsScraper', '.jsc-targeted', function () {
		if (select_tools.panel_add_tag) {
			return;
		}
		tag_elements();
		
    }).mousemove(function(event) {
        currentMousePos.x = event.pageX;
        currentMousePos.y = event.pageY;
    });

    analyze_elements();
});

