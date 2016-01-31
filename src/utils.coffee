unless @jsc
  @jsc = {}

(->
  class @Utils
    parseStyleDefinitions: (styleText) ->

      # strip comments
      styleText = styleText.replace('<!--','').replace('-->','')

      defs = {}
      for def in styleText.split '}'
        def = def.split '{'
        if def[0].indexOf('.') >= 0 # select classes
          selector = def[0].replace /[\s\.]/g, '' # clear dot
          cssText = def[1].replace /\s/g, '' # TODO better normalize, sort keys

          sha1 = 'sha' + CryptoJS.SHA1(cssText).toString(CryptoJS.enc.Base64)

          defs[sha1] = {
            selector: selector,
            cssText: cssText,
          };

      return defs

    parseToPixels: (pos) ->
      if /px$/.test pos
        return parseInt pos

      else if pos == 'auto'
        return null

      throw "parseToPixels unimplemented for: " + pos

  class @ColorPaletteLightFirst
    constructor: (@alpha = 1.0, @hue_step = 31, @lmin = 25, @lstep = 15, @lcount = 4, @i = 55, @istep = -1)->
      @lmax = @lmin + @lstep * (@lcount - 1);

    nextColor: () ->
      hue = (Math.floor(@i / @lcount) * @hue_step) % 360
      if Math.floor(@i / @lcount) % 2
        lt = @lmax - (@i % @lcount) * @lstep
      else
        lt = @lmin + (@i % @lcount) * @lstep;

      @i = @i + @istep;
      return 'hsla(' + hue + ', 100%, ' + lt + '%, ' + @alpha + ')'

  class @ColorPaletteHueFirst
    constructor: (@alpha = 1.0, @hue_step = 23, @lmax = 60, @lstep = 15, @i = 0, @istep = 1) ->

    nextColor: () ->
      hue = @i * @hue_step % 360
      lt = @lmax - Math.floor(@i * @hue_step / 360) * @lstep

      @i = @i + @istep;
      return 'hsla(' + hue + ', 100%, ' + lt + '%, ' + @alpha + ')'

).call @jsc
