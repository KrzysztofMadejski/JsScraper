<?

require_once("simple_html_dom.php");

$offset = 8;

class Processor
{
    private $rules;
    private $line_buff;
    private $data;
    private $columns;

    function loadRules($file)
    {
        $string = file_get_contents($file);
        $this->rules = json_decode($string, true);

        // clean return values
        $this->data = array();
        $this->columns = array();

        foreach($this->rules as $tag) {
            if ($tag['ignore'])
                continue;

            $this->columns[] = $tag['name'];
        }

        // clean page values
        $last_tag = null;
        $curr_row = array();
    }

    function process_range($start, $end, $resolve_page_path)
    {
        for ($page = $start; $page <= $end; $page++) {
            $path = $resolve_page_path($page);

            $this->feed($path);
        }
        $this->finish();
    }

    private function sortTBLR($a, $b) {
        if (parseToPixels($(a).css('top')) <= parseToPixels($(b).css('top')) - line_buff) {
            return -1;
        } else if (parseToPixels($(a).css('top')) - line_buff >= parseToPixels($(b).css('top'))) {
            return 1;
        }
        return parseToPixels($(a).css('left')) - parseToPixels($(b).css('left'));
    }

    private function parseToPixels($pos) {
        if (/px$/.test($pos)) {
            return parseInt($pos);
        } else if ($pos == 'auto') {
            return null;
        }
	throw "parseToPixels unimplemented: " + $pos;
    }

    private static function text($el) {
        if ($el == null) {
            return null;
        }
        return trim(str_replace('&nbsp;', '', $el->plaintext));
    }

    private function tag_matches($tag, $el) {
        foreach($tag['filters'] as $f) {
            if ($this->filter_matches($f, $el)) {
                return true;
            }
        }
        return false;
    }

    private function filter_matches($f, $el) {

    }

    private function feed($path) {
        // load page as DOM
        $html = file_get_html($path);

        // sort all <p> elements in read order (TB-LR)
        $sorted = usort($html->find('p'), $this->sortTBLR);

        foreach($sorted as $el) {
            // tag element with first matching set of filters
            $tag = null;
            foreach($this->rules as $t) {
                if ($this->tag_matches($t, $el)) {
                    $tag = $t;
                    break;
                }
            }

            // if not matched then skip
            if ($tag == null || $tag['ignore'])
                continue;

            $tag_name = $tag['name'];

            if ($tag != $this->last_tag) {
                if ($this->data[-1][$tag_name] != null) {
                    // this field was filled before so start a new row
                    $this->data[] = array();
                }
                $this->data[-1][$tag_name] = self::text($el);

            } else {
                // append text to last_tag (TODO sometimes[ie empty sections] this may be wrong behavior, TODO glueing rules)
                $this->data[-1][$tag_name] .= self::text($el);
            }
        }
    }

    private function finish() {
        // pop last row if unneccesary added
        if (empty($this->data[-1])) {
            array_pop($this->data);
        }
    }
}

$p = new Processor();
$p->loadRules('rules_wydatki_biezace.json');

$p->process_range(159, 285, function($page_num) {
    return "htmlc/wb_budzet_20140131-$page_num.html";
});

/*
 *

// PARSE:  Wydatki bieżące – zadania własne s.149
// parse range: 159 - 285




// PARSE: Wydatki majątkowe – zadania własne s.279
// PARSE: Wydatki – zadania zlecone s.313
// PARSE: Wydatki – zadania na podstawie porozumień s.329

*/