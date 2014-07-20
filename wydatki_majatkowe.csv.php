<?php

error_reporting(E_ALL ^ E_NOTICE);

function kwoty($val, $count) {
    if ($val == null || $val == '')
        return array($val);

    if ($count == 2)
        $pattern = "/(\d+(\.\d+)*) (\d+(\.\d+)*)/";
    else
        $pattern = "/(\d+(\.\d+)*) (\d+(\.\d+)*) (\d+(\.\d+)*)/";

    $val = preg_replace("/[\s\r\n\xa0\x20\xc2]+/", ' ', $val);

    if (($found = preg_match($pattern, $val, $matches)) > 0) {
        if ($count == 3)
            $ret = array($matches[1], $matches[3], $matches[5]);
        else
            $ret = array($matches[1], $matches[3]);

    } else {
        preg_match_all("/(\d+(\.\d+)*)/", $val, $matches);

        echo "Choose which in $val\n";
        var_export($matches[0]);
        echo "\n>";

        $handle = fopen ("php://stdin","r");
        $choose = explode(',', trim( fgets($handle) ));
        $ret = array();
        foreach($choose as $k) {
            $ret[] = $matches[0][intval($k)];
        }
    }

    foreach($ret as $v) {
        if ($v != '0' && $v != 0)
            $val = str_replace($v, '', $val);
    }
    $val = preg_replace('/\s+/', ' ', $val);

    array_unshift($ret, $val);
    return $ret;
}

function clean($t) {
    $t = trim($t);
    return $t == '' ? null : $t;
}

$row = 0;
$whandle = fopen("wydatki_majatkowe2.csv", "w");
fputcsv($whandle, array('biuro_nazwa', 'biuro_ogolem', 'biuro_WPF', 'biuro_pozostale', 'dzial_nazwa', 'dzial_WPF', 'dzial_pozostale', 'dzials_nazwa', 'dzials_WPF', 'dzials_pozostale',
       'zadanie_num', 'zadanie_tresc', 'zadanie_WPF', 'zadanie_pozostale'), ';');

if (($handle = fopen("wydatki_majatkowe.csv", "rb")) !== FALSE) {
    $ret = array(null, null, null, null, null, null, null, null, null, null, null, null, null);
    while (($data = fgetcsv($handle, 0, ";")) !== FALSE) {

        $row++;
        if ($row == 1)
            continue;

        $data = array_map("clean", $data);

        // dane
        //
        $process_cols = array(0, 1, 2, 4);

        list($data[0], $ogolem, $WPF, $pozostale) = kwoty($data[0], 3);
        list($data[1], $dWPF, $dpozostale) = kwoty($data[1], 2);
        list($data[2], $dsWPF, $dspozostale) = kwoty($data[2], 2);
        list($data[4], $zWPF, $zpozostale) = kwoty($data[4], 2);

        $ret[0] = $data[0] == null ? $ret[0] : $data[0];
        $ret[1] = $ogolem == null ? $ret[1] : $ogolem;
        $ret[2] = $WPF == null ? $ret[2] : $WPF;
        $ret[3] = $pozostale == null ? $ret[3] : $pozostale;
        $ret[4] = $data[1] == null ? $ret[4] : $data[1];
        $ret[5] = $dWPF == null ? $ret[5] : $dWPF;
        $ret[6] = $dpozostale == null ? $ret[6] : $dpozostale;
        $ret[7] = $data[2] == null ? $ret[7] : $data[2];
        $ret[8] = $dsWPF == null ? $ret[8] : $dsWPF;
        $ret[9] = $dspozostale == null ? $ret[9] : $dspozostale;
        $ret[10] = $data[3] == null ? $ret[10] : $data[3];
        $ret[11] = $data[4] == null ? $ret[11] : $data[4];
        $ret[12] = $zWPF == null ? $ret[12] : $zWPF;
        $ret[13] = $zpozostale == null ? $ret[13] : $zpozostale;

        fputcsv($whandle, $ret, ';');
    }

    fclose($handle);
}
fclose($whandle);