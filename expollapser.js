/*
Expollapser version 0.11.0
*/

(function ($) {

	// Defaults
	var expollapser_defaults = {
		'toggler': 'header',
		'contentElement': 'next',
		'expandHeaderCss': null,
		'expandBodyCss': null,
		'collapseHeaderCss': null,
		'collapseBodyCss': null,
		'headerReplaceHtml': '',
		'open': false,
		'contentHtml': '',
		'expandAnimator': function (header, body, toggler, callback) { $(body).slideDown(200, callback); },
		'collapseAnimator': function (header, body, toggler, callback) { $(body).slideUp(200, callback); },
		'postExpand': function (header, body, toggler) { },
		'preCollapse': function (header, body, toggler) { },
		'postCollapse': function (header, body, toggler) { },
		'togglerSeparation': false
	};

	function expollapser_setDefaults(options) {
		if (options) {
			$.extend(expollapser_defaults, options);
		}
	}

	// Define methods of the expollapser plugin
	var methods = {

		// init : Sets up the plugin on the matched element(s)
		init: function (options) {
			return this.each(function () {
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
					settings.contentElement = processContentElement(settings.contentElement);
					settings.headerReplaceHtml = processHeaderReplaceHtml(settings.headerReplaceHtml);

					$(this).bind('preExpand', function (e, context) {
						ensureClass(context.header, settings.expandHeaderCss);
						ensureClassRemoved(context.header, settings.collapseHeaderCss);
						ensureClass(context.body, settings.expandBodyCss);
						ensureClassRemoved(context.body, settings.collapseBodyCss);
					});

					$(this).bind('postExpand', function (e, context) {
						settings.headerReplaceHtml(context.header);
					});

					$(this).bind('postCollapse', function (e, context) {
						ensureClassRemoved(context.header, settings.expandHeaderCss);
						ensureClass(context.header, settings.collapseHeaderCss);
						ensureClassRemoved(context.body, settings.expandBodyCss);
						ensureClass(context.body, settings.collapseBodyCss);
						settings.headerReplaceHtml(context.header);
					});

					settings.contentHtml = processContentHtml(settings.contentHtml, settings);

					// Setup data
					$(this).data('expollapser', {
						isopen: settings.open,
						getTogglers: resolveTogglers(settings.toggler, $this),
						contentLoaded: false,
						disabled: false,
						settings: settings
					});

					if (settings.open == true) {
						ensureClass($(this), settings.expandHeaderCss);
						ensureClass(settings.contentElement($(this)), settings.expandBodyCss);
						settings.headerReplaceHtml($(this));
						settings.contentElement($this).show();
					}
					else {
						ensureClass($(this), settings.collapseHeaderCss);
						ensureClass(settings.contentElement($(this)), settings.collapseBodyCss);
						settings.headerReplaceHtml($(this));
						settings.contentElement($this).hide();
					}

					// Setup togglers
					ensureToggleHookup($(this).data('expollapser').getTogglers, $(this));
				}
			});
		},

		// disable: Disables expand/collapse functionality
		disable: function () {
			return this.each(function () {
				$(this).data('expollapser')['disabled'] = true;
				$(this).data('expollapser').getTogglers($(this)).css('cursor', 'auto');
			})
		},

		// enable: Enables expand/collapse functionality
		enable: function () {
			return this.each(function () {
				$(this).data('expollapser')['disabled'] = false;
				$(this).data('expollapser').getTogglers($(this)).css('cursor', 'hand');
			})
		},

		// toggle: Toggles between expanded and collapsed state
		toggle: function (toggler) {
			return this.each(function () {
				var data = $(this).data('expollapser');

				// Handle special case with multiple togglers producing multiple contents
				if (data.isopen == true && data.settings.togglerSeparation && data.expandedBy.get(0) != toggler.get(0)) {
					var $this = $(this);
					$(this).expollapser('collapse', data.expandedBy, function () { $this.expollapser('expand', toggler) });
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
		expand: function (toggler) {
			return this.each(function () {
				var $this = $(this);
				var data = $(this).data('expollapser');
				var settings = data.settings;
				if (data.isopen == false && data.disabled == false) {
					if (toggler == null)
						toggler = $(data.getTogglers($this).get(0));
					var bodyElement = settings.contentElement($(this));
					$(this).trigger('preExpand', { header: $this, body: bodyElement, toggler: toggler });

					// Set content and do expand animation
					data.expandedBy = toggler;
					data.isopen = true;
					settings.contentHtml($(this), bodyElement, toggler, function () { });
					settings.expandAnimator($this, bodyElement, toggler, function () {
						$this.trigger('postExpand', { header: $this, body: bodyElement, toggler: toggler });
					});
				}
			});
		},

		collapse: function (toggler, callback) {
			return this.each(function () {
				var $this = $(this);
				var data = $this.data('expollapser');
				var settings = $this.data('expollapser').settings;
				if (data.isopen == true && data.disabled == false) {
					if (toggler == null)
						toggler = data.expandedBy;
					if (toggler == null)
						toggler = $this;
					var bodyElement = settings.contentElement($this);
					settings.preCollapse($this, bodyElement, toggler);

					data.isopen = false;
					settings.collapseAnimator($this, bodyElement, toggler, function () {
						$this.trigger('postCollapse', { header: $this, body: bodyElement, toggler: toggler });
						if (callback)
							callback();
					});
				}
			});
		}
	};

	// Ensures that the supplied togglers function on the supplied header element is setup with click events
	function ensureToggleHookup(togglersFn, headerElement) {
		togglersFn(headerElement).each(function () {
			// Set up click events of togglersFn if they have no click event already
			if (!$.data(this, 'events') || !$.data(this, 'events')['click'] || $.data(this, 'events')['click'].length == 0) {
				$(this).css('cursor', 'hand');
				if (!$(this).data('expollapser'))
					$(this).data('expollapser', { oldHtml: null });
				else
					$.extend($(this).data('expollapser'), { oldHtml: null });

				$(this).bind('click.expollapser', function () {
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

	function insertFn(fn, fnInsert) {
		return function (header, content, toggler) {
			fnInsert(header, content, toggler);
			fn(header, content, toggler);
		};
	}

	function ensureClass(jq, cssClass) {
		if (cssClass && !jq.hasClass(cssClass))
			jq.addClass(cssClass);
	};

	function ensureClassRemoved(jq, cssClass) {
		if (cssClass)
			jq.removeClass(cssClass);
	};

	// Parses contentElement setting and returns a function to get the content element
	function processContentElement(contentSetting) {
		assertStringOrFunction(contentSetting, 'contentElement');
		if (typeof contentSetting === 'string') {
			if (contentSetting == 'next')
				return function (headerElement) { return headerElement.next(); };
			else if (contentSetting == 'prev')
				return function (headerElement) { return headerElement.prev(); };
			else
				return function () { return $(contentSetting); };
		}

		return contentSetting;
	}

	// Parse for convenience settings in togglers
	function resolveTogglers(togglersSetting, $header) {
		assertStringOrFunction(togglersSetting, 'togglers');
		var togglersFunction;
		if (typeof togglersSetting === 'string') {
			if (togglersSetting == 'header') {
				return function () { return $header; };
			}
			else if (togglersSetting == 'headerLinks') {
				return function () { return $('a', $header); };
			}
			else {
				var stringSetting = togglersSetting;
				return function () { return $(stringSetting, $header); };
			}
		}

		return togglersSetting;
	}

	function processHeaderReplaceHtml(setting) {
		assertStringOrFunction(setting, 'headerReplaceHtml');
		if (typeof setting === 'string') {
			var html = setting;
			if (html.indexOf('<-->') > -1) {
				var replaceExpressions = html.split(',');
				return function (header) {
					for (var item in replaceExpressions) {
						var pair = replaceExpressions[item].split('<-->');
						if (header.data('expollapser') && header.data('expollapser').isopen == true) {
							header.html(header.html().replace(pair[0], pair[1]));
						}
						else {
							header.html(header.html().replace(pair[1], pair[0]));
						}
					}
				};
			}

			return function () { };
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
				processedSetting = function (header, content, toggler, callback) {
					$.get(toggler.attr(stringSetting.substring(12)), function (response) {
						content.html(response);
						callback();
					});
				};
				settings.togglerSeparation = true;
			}
			else if (setting.beginsWith('url:'))
				processedSetting = function (header, content, toggler, callback) {
					$.get(stringSetting.substring(4), function (response) {
						content.html(response);
						callback();
					});
				};
			else if (setting.length > 0)
				processedSetting = function (header, content, toggler, callback) {
					content.html(stringSetting);
					callback();
				};
			else
				processedSetting = function (header, content, toggler, callback) { callback(); };
		}
		else {
			processedSetting = setting;
		}

		var finalSetting = function (header, content, toggler, callback) {
			var id = getUniqueId(header, content, toggler);
			if (header.data('expollapser').contentLoaded != id) {
				processedSetting(header, content, toggler, function () {
					ensureToggleHookup(header.data('expollapser').getTogglers, header);
					callback();
				});
			}
			else
				callback();
		};

		return finalSetting;
	}

	function getUniqueId(elem1, elem2, elem3) {
		return $(elem1).attr($.expando) + $(elem2).attr($.expando) + $(elem3).attr($.expando);
	}

	// Core plugin registration point
	$.fn.expollapser = function (method) {

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

	// Prototype extensions for common used string functions
	String.prototype.beginsWith = function (t, i) {
		if (i == false) {
			return (t == this.substring(0, t.length));
		}
		else {
			return (t.toLowerCase() == this.substring(0, t.length).toLowerCase());
		}
	}

	String.prototype.endsWith = function (t, i) {
		if (i == false) {
			return (t == this.substring(this.length - t.length));
		}
		else {
			return (t.toLowerCase() == this.substring(this.length - t.length).toLowerCase());
		}
	}
})(jQuery);

