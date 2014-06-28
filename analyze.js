// <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js"></script>

// TODO Aby dzialal
// - hierarchicznosc kolumn (edytor drzewek - pozycja lewo,prawo; div:margin-left < > )

// TODO przebudowac architekture
// - definiowanie i zbieranie danych osobno
// - MVC + templates - Knockout
// - osobno kontener danych (warunkowe dodanie danych z nowej strony, numer wiersza ostatniego i wypelnione w nim pola)
// - przetwarzanie aktualnej strony, aby wyswietlal wyniki (wyniki danej strony podswietlone)

// TODO Aby bylo zajebiscie
// - kolorowanie klasy
// - rownolegle ladowanie stylu i contentu
// - jakie sa aktywne filtry
// - przesuwanie leveli prawo-lewo ma nieruchome strzalki

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

function showHierarchy() {
	$('#hierarchy').empty();
	$.each(tags, function(idx, tag) {
		row = $('<li>' + tag.name + ' <a class="hierarchy-left">&lt;</a> <a class="hierarchy-right">&gt;</a></li>');
		row.addClass(tag.name);
		row.css('margin-left', (17 * tag.level) + 'px');
		$('#hierarchy').append(row);
	});
}

function moveHierarchyLeft() {
	tagName = $(this).parent().attr('class');
	$.each(tags, function(idx, tag) {
		if (tag.name == tagName) {
			tag.level -= 1;
			if (tag.level < 0) {
				tag.level = 0;
			}
		}
	});
	
	// show rules
	$('#rules').val(JSON.stringify(tags));
	
	showHierarchy();
}

function moveHierarchyRight() {
	tagName = $(this).parent().attr('class');
	$.each(tags, function(idx, tag) {
		if (tag.name == tagName) {
			tag.level += 1;
		}
	});
	
	// show rules
	$('#rules').val(JSON.stringify(tags));
	
	showHierarchy();
}

function tagByDefinition() {
	$.each(tags, function(idx, tag) {
		$.each(tag.filters, function(fidx, f) {
			filters = $.extend({}, f);
			
			select_tools.t_class = filters.f_classes && filters.f_classes.length > 0; 
			if (select_tools.t_class)
				select_tools.cache_classes = filters.f_classes;
			select_tools.t_sameline = filters.t_sameline;
			// TODO stan niezalezny od filtra, funkcja find_by_filter

			highlight_targeted();

			if (tag.ignore) {
				$('.jsc-targeted').addClass(jsc_class_prefix + 'ignore-' + tag.name);	
			} else {
				$('.jsc-targeted').addClass(jsc_class_prefix + 'tag-' + tag.name);	
			}	
			$('.jsc-targeted').addClass('jsc-processed');
			$('.jsc-targeted').removeClass('jsc-targeted');

			reset_filters();
		});
	});
}

function process_range(page_limit_inclusive) {
	if (page_limit_inclusive && page_num >= page_limit_inclusive) {
		return;
	}
	
    // "process next" na razie
    page_num += 1;
    next_page = window.location.href.replace(/\-\d+\.html$/, '-' + page_num + '.html');
	
	// change content
    $('#page' + original_page_num + '-div').load(next_page + ' #page' + page_num + '-div > *', function() {
		// update styles
		$.get(next_page, function(data) { 
			newStyles = $(data).siblings('style').text();
			newClassDefs = parseStyleDefinitions(newStyles);
			tagElementsClass(newClassDefs);

			$('head style')[0].innerHTML = newStyles;
			
			// foreach tag select corresponding elements and tag them
			// TODO horrible hack
			tagByDefinition();			

			sort_and_prepare_data();	
			
			if (page_limit_inclusive)
				process_range(page_limit_inclusive);
		});
	});
}

function mapClass(cl) {
	sha1 = oldClassDefs[cl].sha1;
	for(newCl in newClassDefs) {
		if (newClassDefs[newCl].sha1 == sha1) {
			return newCl;
		}
	}
	
	// class doesn't exist, return random so selector works
	return '' + CryptoJS.SHA1('' + Math.random());
}

function parseStyleDefinitions(styleText) {
	defs = {};
	
	styleText = styleText.replace('<!--','').replace('-->','');
	$.each(styleText.split('}'), function(idx, def) {
		def = def.split('{');
		if (def[0].indexOf('.') >= 0) {
			sel = def[0].replace(/[\s\.]/g, '');
			cssText = def[1].replace(/\s/g, ''); // TODO better normalize, sort keys
			defs[sel] = {
				cssText: cssText,
				sha1: 'sha' + CryptoJS.SHA1(cssText).toString(CryptoJS.enc.Base64)
			};
		}
	});
	
	return defs;
}


last_tag = null;
last_tag_level = -1;
curr_row = {};

function sort_and_prepare_data() {
	table = $('#data table');
	
	// 3px buffer
	sorted = $('p').sort(_sort_LR);
	
	sorted.each(function(idx, el) {
		tagClass = $(el).attr('class').split(/\s+/).filter(function(cl) {
			return cl.indexOf(jsc_class_prefix + 'tag-') == 0;
		});
		if (tagClass.length > 0) {			
			tagName = tagClass[0].substr((jsc_class_prefix + 'tag-').length);
			tag = getTagBy(tagName);
			
			if (tagName != last_tag) {
				if (curr_row[tagName] != null || tag.level < last_tag_level ) {
					// this field was filled before so start a new row
					_append_data_row(table, curr_row);
					
					curr_row = {};
				}
				curr_row[tagName] = $(el).text();
				
			} else {
				// append text to last_tag (TODO sometimes[ie empty sections] this may be wrong behavior, TODO glueing rules)
				curr_row[tagName] += ' ' + $(el).text(); 
			}
			last_tag = tagName;
			last_tag_level = tag.level;
		}
	});
}

function data_finish() {
	table = $('#data table');
	
	// last_row
	if (tags.some(function(tagdef){ return curr_row[tagdef.name] != null; })) {
		_append_data_row(table, curr_row);
	}
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
                // overlapping line strap
                ctop = parseToPixels($(c).css('top'));
                cbottom = parseToPixels($(c).css('top')) + $(c).height();
                ptop = parseToPixels($(p).css('top'));
                pbottom = parseToPixels($(p).css('top')) + $(p).height();

				if (!(ctop > pbottom || ptop > cbottom)) {
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

function updateCsv() {
	table = $('#data table');
	csv_wrapper = $('#csv');
	
	// TODO escape csv
	csv = '';
	table.find('tr').each(function (ridx, row) {
		$(row).children().each(function(cidx, fld) {
			csv += $(fld).text() + ";";
		});
		
		csv += "\n";
	});
	
	csv_wrapper.text(csv);
}

function getTagBy(name) {
	for(i=0; i<tags.length;i++) {
		if (tags[i].name == name) {
			return tags[i];
		}
	}
	return null;
}

function uploadRules() {
	tags = JSON.parse($('#rules').val());
	reset_filters();
	showHierarchy();
	
	$('.jsc-processed').each(function(idx, el) {
		$.each($(el).attr('class').split(/\s+/), function(cidx, cl) {
			if (cl.indexOf('jsc-') == 0) {
				$(el).removeClass(cl);
			}
		});
	});
	
	last_tag = null;
	last_tag_level = -1;
	curr_row = {};
	
	$('#data table').empty();
	
	tagByDefinition();
	sort_and_prepare_data();
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
			level: 0,
			filters: [filters_copy]
		});
		showHierarchy();
		
	} else if (this.id == 'useExistingTag') {
		if (tags.length == 0)
			return;
			
		tagName = $('#select-tools select[name="existingTag"]').val();
		getTagBy(tagName).filters.push(filters_copy);
		
	} else if (this.id == 'cancel') {
		select_tools.panel_add_tag = false;
		select_tools.div.tools.toggle();
		return;
	}
	
	// mark elements as processed
	if (ignoreTag) {
		$('.jsc-targeted').addClass(jsc_class_prefix + 'ignore-' + tagName);	
	} else {
		$('.jsc-targeted').addClass(jsc_class_prefix + 'tag-' + tagName);	
	}	
	$('.jsc-targeted').addClass('jsc-processed');
	
	// update select
	select = $('#select-tools select[name="existingTag"]');
	select.empty();
	$.each(tags, function(idx, t) {
		select.append($('<option></option>').attr("value", t.name).text(t.name));
	});
	
	
	// hide panel, rerender
	select_tools.panel_add_tag = false;
	select_tools.div.tools.toggle();
	
	reset_filters(); // TODO cache_classes ?
	
	// refresh table headers
	header = $('<tr></tr>')
	$.each(tags.filter(function(tagdef) {
		return !tagdef.ignore;
	}), function(idx, tag) {
		header.append($('<th>' + tag.name + '</th>'));
	});
	
	table = $('#data table');
	if (table.find('thead').length == 0)
		table.append($('<thead></thead>'));
	table.find('thead').empty();
	table.find('thead').append(header);
	
	// show rules
	$('#rules').val(JSON.stringify(tags));
}

function on_mouseenter() {
	if (select_tools.panel_add_tag) {
		return;
	}
	
	jel = $(this);
	
	// remember classes
	if (jel.attr('class')) {
		select_tools.cache_classes = jel.attr('class').split(/\s+/).filter(function(cl) {
			return cl.indexOf(jsc_class_prefix) != 0 && cl.indexOf('ft') != 0;
			// TODO sha classes to be shown, indexOf ft goes out
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

	page_num_part = /\-\d+\.html$/.exec(window.location.href)[0];	
    original_page_num = page_num = parseInt(page_num_part.substr(1, page_num_part.length - 6));
	
	page = $('#page' + page_num + '-div');

    select_tools.div.tools = $('<div id="select-tools" class="jsc-elem" style="display:none;">' +
        'Add new: <input name="tagName"/> <input id="addNewTag" type="submit" value="Dodaj"/><input id="ignoreTag" type="submit" value="Ignore"/></br>' +
		'or use existing: <select name="existingTag"></select><input id="useExistingTag" type="submit" value="Dodaj"/></br>' +
		 '<input id="cancel" type="submit" value="Cancel"/>' +
        '</div>');
	select_tools.div.data = $('<div id="data" class="jsc-elem" style="">'
		+ '<div>Hierarchia danych:<ul id="hierarchy"></ul></div>'
		+'Data:<table></table>' 
		+ '<div>Rules:</div><textarea id="rules"></textarea><div><input id="uploadRules" type="button" value="Upload Rules"/><input id="updateCsv" type="button" value="Update CSV"/></div><textarea id="csv"></textarea></div>');
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
	$(document).on('click', 'input#updateCsv', updateCsv);
	$(document).on('click', 'input#uploadRules', uploadRules);
	$(document).on('click', '.hierarchy-right', moveHierarchyRight);	
	$(document).on('click', '.hierarchy-left', moveHierarchyLeft);
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
			process_range(e.shiftKey ? 285 : null);
			
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
	oldClassDefs = parseStyleDefinitions($('head style').text());
	newClassDefs = $.extend({}, oldClassDefs); // 1:1 mapping	
	
	tagElementsClass(oldClassDefs);
});

function tagElementsClass(classDefs) {
	for(sel in classDefs) {
		$('.' + sel).addClass(classDefs[sel].sha1);
		//$('.' + sel).removeClass(sel);
	}
}

var oldClassDefs = {};
var newClassDefs = {};
