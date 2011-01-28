/*
Expollapser version 0.8.1212

init: Use this method to initialize the expollapser.
	toggler: Controls what element should work as toggler(s) for the expollapsible.
		'header' :					Default setting. The header element will be made clickable and will be the toggler.
		'headerLinks' :			All anchor tags inside the header will be togglers.
		jQuery expression :	The supplied jQuery expression (evaluated in the context of the header) will determine the toggler(s)
		function (headerElement) : A custom function that is given the expollapser's header element as a jQuery object and should return a
															 jQuery object containing all togglers for the expollapser.
	contentElement: Tells how to identify the content element.
		'next' : Default setting. The content element will be found by getting the next sibling to the header DOM element.
		'prev' : The content element will be found by getting the previous sibling to the header DOM element.
		jQuery expression : The supplied jQuery expression will determine the content element.
		function (headerElement) : A custom function that is given the header element and should return a jQuery object
															 representing the content element.
expandContentCss : CSS class(es) to apply on the header when the expollapser is expanded.
You can use 'classname' which will automatically apply the class on expand and remove the class on collapse. Or you
can use '+classname' to dictate that the class should be added on expand, but not removed. Or you can use '-classname'
the dictate that the class should be removed on expand.


*/

var expollapser_defaults = {
	'toggler': 'header',
	'contentElement': 'next',
	'expandHeaderCss': '',
	'expandContentCss': '',
	'collapseHeaderCss': '',
	'collapseContentCss': '',
	'headerChangeHtml': null,
	'togglerChangeHtml': null,
	'contentHtml': '',
	'expandAnimator': function(header, content, toggler, callback) { $(content).slideDown(200, callback); },
	'collapseAnimator': function(header, content, toggler, callback) { $(content).slideUp(200, callback); },
	'preExpand': function(header, content, toggler) { },
	'postExpand': function(header, content, toggler) { },
	'preCollapse': function(header, content, toggler) { },
	'postCollapse': function(header, content, toggler) { },
	'autoHookupChildrenOn': '',
	'postContentLoad': function(header, content, toggler) { },
	'togglerSeparation': false
};

function expollapser_setDefaults(options) {
	if (options) {
		$.extend(expollapser_defaults, options);
	}
}

(function($) {

	// Define methods of the expollapser plugin
	var methods = {

		// init : Sets up the plugin on the matched element(s)
		init: function(options) {
			return this.each(function() {
				var $this = $(this);
				var data = $this.data('expollapser');

				// If the plugin hasn't been initialized yet
				if (!data) {
					var settings = $.extend({}, expollapser_defaults); // Clone, shallow copy

					// Merge user options
					if (options) {
						$.extend(settings, options);
					}

					// Process the settings, basically by converting all convenience string settings
					// to underlying functions.
					settings.toggler = processTogglers(settings.toggler);
					settings.contentElement = processContentElement(settings.contentElement);
					processCssSetting(settings, 'expandHeaderCss', 'collapseHeaderCss');
					processCssSetting(settings, 'expandContentCss', 'collapseContentCss');
					processCssSetting(settings, 'collapseHeaderCss', 'expandHeaderCss');
					processCssSetting(settings, 'collapseContentCss', 'expandContentCss');
					settings.headerChangeHtml = processHeaderChangeHtml(settings.headerChangeHtml);
					settings.togglerChangeHtml = processTogglerChangeHtml(settings.togglerChangeHtml);
					settings.contentHtml = processContentHtml(settings.contentHtml, settings);

					// Setup data
					$(this).data('expollapser', {
						isopen: false,
						contentLoaded: false,
						hookedUp: false,
						disabled: false,
						settings: settings
					});

					// Setup togglers
					ensureToggleHookup(settings.toggler, $(this));
				}
			});
		},

		// disable: Disables expand/collapse functionality
		disable: function() {
			return this.each(function() {
				$(this).data('expollapser')['disabled'] = true;
				$(this).data('expollapser').settings.toggler($(this)).css('cursor', 'auto');
			})
		},

		// enable: Enables expand/collapse functionality
		enable: function() {
			return this.each(function() {
				$(this).data('expollapser')['disabled'] = false;
				$(this).data('expollapser').settings.toggler($(this)).css('cursor', 'hand');
			})
		},

		// toggle: Toggles between expanded and collapsed state
		toggle: function(toggler) {
			return this.each(function() {
				var data = $(this).data('expollapser');

				// Handle special case with multiple togglers producing multiple contents
				if (data.isopen == true && data.settings.togglerSeparation && data.expandedBy.get(0) != toggler.get(0)) {
					var $this = $(this);
					//if (data.expandedBy.data('expollapser').oldHtml) {
					//	data.expandedBy.html(data.expandedBy.data('expollapser').oldHtml);
					//	data.expandedBy.data('expollapser').oldHtml = null;
					//}
					$(this).expollapser('collapse', data.expandedBy, function() { $this.expollapser('expand', toggler) });
				}
				else { // Default toggle
					if (data.isopen == false)
						$(this).expollapser('expand', toggler);
					else {
						$(this).expollapser('collapse', toggler);
					}
				}
			});
		},

		// expand: Expands the matched element(s)
		expand: function(toggler) {
			return this.each(function() {
				var $this = $(this);
				var data = $this.data('expollapser');
				var settings = $this.data('expollapser').settings;
				if (data.isopen == false && data.disabled == false) {
					if (toggler == null)
						toggler = settings.toggler.get(0);
					var contentElement = settings.contentElement($this);
					settings.preExpand($this, contentElement, toggler);
					applyCss(settings.expandHeaderCss, $this);
					applyCss(settings.expandContentCss, contentElement);

					// Store old html of toggler and set new toggler html (if opted in)
					if (settings.togglerChangeHtml) {
						toggler.data('expollapser').oldHtml = toggler.html();
						settings.togglerChangeHtml(toggler);
					}
					// Store old html of header and set new header (if opted in)
					if (settings.headerChangeHtml) {
						data.headerOldHtml = $this.html();
						settings.headerChangeHtml($this);
						ensureToggleHookup(settings.toggler, $this, settings.contentHtml);
					}

					// Set content and do expand animation
					settings.contentHtml($this, contentElement, toggler, function() {
						data.expandedBy = toggler;
						data.isopen = true;

						settings.expandAnimator($this, contentElement, toggler, function() {
							// Handle option of automatically hooking up nested, lazy loaded expollapsers
							if (data.hookedUp == false && settings.autoHookupChildrenOn != '') {
								$(settings.autoHookupChildrenOn, contentElement).expollapser(settings);
								data.hookedUp = true;
							}

							data.settings.postExpand($this, contentElement, toggler);
						});
					});

				}
			});
		},

		collapse: function(toggler, callback) {
			return this.each(function() {
				var $this = $(this);
				var data = $this.data('expollapser');
				var settings = $this.data('expollapser').settings;
				if (data.isopen == true && data.disabled == false) {
					if (toggler == null)
						toggler = data.expandedBy;
					var contentElement = settings.contentElement($this);
					settings.preCollapse($this, contentElement, toggler);
					applyCss(settings.collapseHeaderCss, $this);
					applyCss(settings.collapseContentCss, contentElement);
					if (toggler.data('expollapser').oldHtml) {
						toggler.html(toggler.data('expollapser').oldHtml);
						toggler.data('expollapser').oldHtml = null;
					}

					if (data.headerOldHtml && data.headerOldHtml.length > 0) {
						$this.html(data.headerOldHtml);
						data.headerOldHtml = null;
						ensureToggleHookup(settings.toggler, $this, settings.contentHtml);
					}

					data.isopen = false;
					settings.collapseAnimator($this, contentElement, toggler, function() {
						data.settings.postCollapse($this, contentElement, toggler);
						if (callback)
							callback();
					});
				}
			});
		}
	};

	// Ensures that the supplied togglers function on the supplied header element is setup with click events
	function ensureToggleHookup(togglers, headerElement) {
		togglers(headerElement).each(function() {
			// Set up click events of togglers if they have no click event already
			if (!$.data(this, 'events') || !$.data(this, 'events')['click'] || $.data(this, 'events')['click'].length == 0) {
				$(this).css('cursor', 'hand');
				if (!$(this).data('expollapser'))
					$(this).data('expollapser', { oldHtml: null });
				else
					$.extend($(this).data('expollapser'), { oldHtml: null });

				$(this).bind('click.expollapser', function() {
					headerElement.expollapser('toggle', $(this));
					return false;
				});
			}
		});
	}

	function assertStringOrFunction(subject, name, allowNull) {
		if ((!subject && allowNull) || typeof subject === 'string' || $.isFunction(subject))
			return;

		alert('Expollapser options error: ' + name + ' should be either a string or a function.');
	}

	// Parses contentElement setting and returns a function to get the content element
	function processContentElement(contentSetting) {
		assertStringOrFunction(contentSetting, 'contentElement');
		if (typeof contentSetting === 'string') {
			if (contentSetting == 'next')
				return function(headerElement) { return headerElement.next(); };
			else if (contentSetting == 'prev')
				return function(headerElement) { return headerElement.prev(); };
			else
				return function() { return $(contentSetting); };
		}

		return contentSetting;
	}

	// Parse for convenience settings in togglers
	function processTogglers(togglersSetting) {
		assertStringOrFunction(togglersSetting, 'togglers');
		if (typeof togglersSetting === 'string') {
			if (togglersSetting == 'header') {
				togglersSetting = function(headerElement) { return headerElement; };
			}
			else if (togglersSetting == 'headerLinks') {
				togglersSetting = function(headerElement) { return $('a', headerElement); };
			}
			else {
				stringSetting = togglersSetting;
				togglersSetting = function(headerElement) { return $(stringSetting, headerElement); };
			}
		}

		return togglersSetting;
	}

	// Processes a css setting (basically converting a non-prefixed class name with corresponding
	// +class and -class settings).
	function processCssSetting(setting, name, pairName) {
		var csses = setting[name].split(',');
		for (var item in csses) {
			if (csses[item].length > 0 && !csses[item].beginsWith('+') && !csses[item].beginsWith('-')) {
				setting[name] = setting[name] + ',+' + csses[item];
				setting[pairName] = setting[pairName] + ',-' + csses[item];
			}
		}
	}

	function processHeaderChangeHtml(setting) {
		assertStringOrFunction(setting, 'headerChangeHtml', true);
		if (typeof setting === 'string') {
			var html = setting;
			setting = function(header) { header.html(html); };
		}

		return setting;
	}

	function processTogglerChangeHtml(setting) {
		assertStringOrFunction(setting, 'togglerChangeHtml', true);
		if (typeof setting === 'string') {
			var html = setting;
			setting = function(toggler) { toggler.html(html); };
		}

		return setting;
	}

	// TODO: getUniqueId check om loaded content.
	function processContentHtml(setting, settings) {
		assertStringOrFunction(setting, 'contentHtml', false);
		var processedSetting;
		if (typeof setting === 'string') {
			var stringSetting = setting;
			if (setting == 'togglerHref')
				stringSetting = 'togglerAttr:href';
			if (stringSetting.beginsWith('togglerAttr:')) {
				processedSetting = function(header, content, toggler, callback) {
					$.get(toggler.attr(stringSetting.substring(12)), function(response) {
						content.html(response);
						callback();
					});
				};
				settings.togglerSeparation = true;
			}
			else if (setting.beginsWith('url:'))
				processedSetting = function(header, content, toggler, callback) {
					$.get(stringSetting.substring(4), function(response) {
						content.html(response);
						callback();
					});
				};
			else if (setting.length > 0)
				processedSetting = function(header, content, toggler, callback) {
					content.html(stringSetting);
					callback();
				};
			else
				processedSetting = function(header, content, toggler, callback) { callback(); };
		}
		else {
			processedSetting = setting;
		}

		var finalSetting = function(header, content, toggler, callback) {
			var id = getUniqueId(header, content, toggler);
			if (header.data('expollapser').contentLoaded != id) {
				processedSetting(header, content, toggler, function() {
					ensureToggleHookup(header.data('expollapser').settings.toggler, header);
					header.data('expollapser').settings.postContentLoad(header, content, toggler);
					callback();
				});
			}
			else
				callback();
		};

		return finalSetting;
	}

	function getUniqueId(elem1, elem2, elem3) {
		return elem1.attr($.expando) + elem2.attr($.expando) + elem3.attr($.expando);
	}

	// Applies the supplied css setting to the supplied element.
	function applyCss(css, element) {
		var csses = css.split(',');
		for (var item in csses) {
			if (csses[item].beginsWith('+')) {
				element.addClass(csses[item].substring(1));
			}
			else if (csses[item].beginsWith('-')) {
				element.removeClass(csses[item].substring(1));
			}
		}
	}

	// Core plugin registration point
	$.fn.expollapser = function(method) {

		// Method calling logic
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		}
		else {
			$.error('Method ' + method + ' does not exist on jQuery.expollapser');
		}
	};
})(jQuery);

// Prototype extensions for common used string functions
String.prototype.beginsWith = function(t, i) {
	if (i == false) {
		return (t == this.substring(0, t.length));
	}
	else {
		return (t.toLowerCase() == this.substring(0, t.length).toLowerCase());
	}
}

String.prototype.endsWith = function(t, i) {
	if (i == false) {
		return (t == this.substring(this.length - t.length));
	}
	else {
		return (t.toLowerCase() == this.substring(this.length - t.length).toLowerCase());
	}
}