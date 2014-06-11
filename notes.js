/*<div id="page159-div" style="position:relative;width:892px;height:1263px;">

 // > $('.ft01') - Biuro + wydatek
 // > $('.ft04') -  Główna kategoria / 710 Działalność usługowa / kasa odłegła w pionie o pixel
 .ft05 w obrębie
 // > $('.ft06') - Podkategorie / 71095 Pozostała dział. /
 > .ft07   - diakrytyczne w obrębie ft06

 02 gmina/powiat (italic)
 00,03(pl),010 nagłówek zadania (podkreslone) - bez kasy (
 takze tresc

 */

$('.ft04').filter(function(idx, el) { return parseInt($(el).css('left')) > 350})
    .map(function(idx, el) {return parseInt($(el).css('left')) + $(el).width()})

// right
parseInt(el.css('left')) + el.width()

// color
css('background-color', 'rgba(255,0,0,0.5)')

//sorting by position:
sort(function (a, b) {
    if (parseInt($(a).css('top')) < parseInt($(b).css('top')) - 10)
        return 1;
    if (parseInt($(a).css('top')) > parseInt($(b).css('top')) + 10)
        return 1;

    if (parseInt($(a).css('left')) < parseInt($(b).css('left')))
        return 1;
    return -1;
})

// szerokość elementu: .width()
//prawy brzeg (wyrównany dla niektórych pozycji) + int:css('left')
