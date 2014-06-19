<?

require_once("simple_html_dom.php");

$offset = 8;

class Processor
{
    private $rules;
    private $line_buff = 3;
    private $match_sameline;
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

    public static function css($el, $key) {
        if (!$el->style)
            return null;

        foreach(explode(';', $el->style) as $entry) {
            list($k, $val) = explode(':', $entry);
            if (trim($key) == trim($k)) {
                return $val;
            }
        }
        return null;
    }

    public function sortTBLR($a, $b) {
        if (self::parseToPixels(self::css($a, 'top')) <= self::parseToPixels(self::css($b, 'top')) - $this->line_buff) {
            return -1;
        } else if (self::parseToPixels(self::css($a, 'top')) - $this->line_buff >= self::parseToPixels(self::css($b, 'top'))) {
            return 1;
        }
        return self::parseToPixels(self::css($a, 'left')) - self::parseToPixels(self::css($b, 'left'));
    }

    private static function parseToPixels($pos) {
        if (preg_match('/px$/', $pos)) {
            return intval($pos);

        } else if ($pos == 'auto') {
            return null;
        }
	    throw new Exception("parseToPixels unimplemented: " . $pos);
    }

    private static function text($el) {
        if ($el == null) {
            return null;
        }
        return trim(str_replace('&nbsp;', '', $el->plaintext));
    }

    private function tag_matches($tag, $el) {
        foreach($tag['filters'] as $f) {
            if ($this->filter_matches($f, $el, $tag['name'])) {
                return true;
            }
        }

        // maybe match by sameline
        // doesn't look into class
        if (count($this->match_sameline[$tag['name']]) > 0) {
            $top = self::parseToPixels($el->css('top'));

            // TODO moze jednak przetwarzac iteracyjnie po tagach, a nie elementach i pozniej sortowac
            // bo tak efekt jest inny niz w css (de facto till-end-of-line) i ciezej bedzie sklejac
            foreach($this->match_sameline[$tag['name']] as $sm) {
                if (abs($top - $sm[0]) <= $this->line_buff) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Feed page to parser
     *
     * @param $path
     */
    private function feed($path) {
        // load page as DOM
        $html = file_get_html($path);

        // clear sameline matching elements
        foreach($this->rules as $tag) {
            $this->match_sameline = array(
                $tag['name'] => array()
            );
        }

        // sort all <p> elements in read order (TB-LR)
        $that = $this;
        $sorted = $html->find('p');
        usort($sorted, function($a, $b) use($that) {return $that->sortTBLR($a, $b); });

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

    private function filter_matches($f, $el, $tag_name) {
        // filter elements are combined using 'and'

        // filter by of-any-class
        if ($f['f_classes']) {

            // skip if element has no class
            if (!$el->class)
                return false;

            $el_classes = preg_split('/\s+/', $el->class);

            if  (count(array_intersect($f['f_classes'], $el_classes)) == 0)
                return false;
        }

        // filter by masks
        if ($f['pmask_south'] != null || $f['pmask_north'] != null
            || $f['pmask_east'] != null || $f['pmask_west'] != null) {

            // compute element rectangle
            $left = self::parseToPixels(self::css($el, 'left'));
            $top = self::parseToPixels(self::css($el, 'top'));
            $right = $left + $el->width(); // TODO width? do tego trzeba silnik js! PROBLEM!
            $bottom = $top + $el->height();

            if ($f['pmask_south'] != null && $top > $f['pmask_south'])
                return false;
            if ($f['pmask_north'] != null && $bottom < $f['pmask_north'])
                return false;
            if ($f['pmask_east'] != null && $left > $f['pmask_east'])
                return false;
            if ($f['pmask_west'] != null && $right < $f['pmask_west'])
                return false;
        }

        // remember this element to match others on the same line
        if ($f['t_sameline']) {
            $this->match_sameline[$tag_name][] = array($top, $bottom);
        }
    }

}

$p = new Processor();
$p->loadRules('rules_wydatki_biezace.json');
// TODO 285
$p->process_range(159, 160, function($page_num) {
    return "htmlc/wb_budzet_20140131-$page_num.html";
});

echo "bla";
/*
 *

// PARSE:  Wydatki bieżące – zadania własne s.149
// parse range: 159 - 285




// PARSE: Wydatki majątkowe – zadania własne s.279
// PARSE: Wydatki – zadania zlecone s.313
// PARSE: Wydatki – zadania na podstawie porozumień s.329

*/