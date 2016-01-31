class Processor
  constructor: ->

  setRules: ->

  getRules: ->

  setInitialStyles: ->

# private functions
  _nextPage: ->

  _prevPage: ->

  _preprocessElements: (elements) ->
    # preprocess size and tag it in element's data
    for el in elements
      do (el) ->
        jel = $(el)
        jel.data 'top', top = Utils.parseToPixels jel.css('top')
        jel.data 'left', left = Utils.parseToPixels jel.css('left')
        jel.data 'width', width = el.width()
        jel.data 'height', height = el.height()
        jel.data 'bottom', top + height
        jel.data 'right', left + width

    null

  @_sort_LR: (a, b) ->
    if $(a).data('top') <= $(b).data('top') - line_buff
      return -1
    else if $(a).data('top') - line_buff >= $(b).data('top')
      return 1
    return $(a).data('left') - $(b).data('left')
