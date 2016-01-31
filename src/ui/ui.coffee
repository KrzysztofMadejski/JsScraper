unless @jsc
  @jsc = {}
(->
  #### Namespace JSC ####

  class UI
    constructor: (document) ->
      @document = document

    _loadStyles: ->
      styles = Utils.parseStyleDefinitions($('head style').text())



).call @jsc

## Ember APP ##
# TODO can it be moved to namespace?
@UI = Ember.Application.create()

# Ember Route
@UI.Router.map ->
  @resource 'jscui', {path: '/'}

@UI.JscuiRoute = Ember.Route.extend
  model: ->
    @store.find('todo')

# Model
@UI.Todo = DS.Model.extend
  title: DS.attr('string'),
  isCompleted: DS.attr('boolean')

# TODO fixture

