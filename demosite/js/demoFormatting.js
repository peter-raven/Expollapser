function fixAndFormat(source) {
	var js_source = source.replace(/^\s+/, '');
	var indent_size = 4;
	var indent_char = ' ';
	var preserve_newlines = true;
	var keep_array_indentation = true;
	var braces_on_own_line = false;
	var html;

	if (js_source && js_source[0] === '<' && js_source.substring(0, 4) !== '<!--') {
		js_source = cleanhtml(js_source);
		html = style_html(js_source, indent_size, indent_char, 80);
	}
	else {
		html = js_beautify(js_source, {
			indent_size: indent_size,
			indent_char: indent_char,
			preserve_newlines: preserve_newlines,
			braces_on_own_line: braces_on_own_line,
			keep_array_indentation: keep_array_indentation,
			space_after_anon_function: true
		});
	}

	html = html.replace(new RegExp('<', "gi"), '&lt;').replace(new RegExp('<', "gi"), '&gt;');

	return html;
}

function cleanhtml(html) {
	temphtml = html;

	// get the html tags and loop through them
	tempregexp = new RegExp("<[^>]+>", "g")
	results = temphtml.match(tempregexp);
	for (i = 0; i < results.length; i++) {
		original = results[i];

		// temporarily strip the already quoted attributes and loop through them
		stripquoted = results[i].replace(/ [^=]+= *"[^"]*"/g, "");
		tempregexp = new RegExp(" [^=]+=[^ |>]+", "g")
		unquoted = stripquoted.match(tempregexp);
		if (unquoted) {
			for (j = 0; j < unquoted.length; j++) {
				// add quotes to unquoted attributes					
				addquotes = unquoted[j].replace(/( [^=]+=)([^ |>]+)/g, "$1\"$2\"");
				results[i] = results[i].replace(unquoted[j], addquotes);
			}
		}
		// convert tags to lowercase
		results[i] = results[i].replace(/<\/?[^>|^ ]+/, function (x) { return x.toLowerCase() })
		// convert attributes to lowercase
		results[i] = results[i].replace(/ [^=]+="/g, function (y) { return y.toLowerCase() })
		// convert style attributes to lowecase
		results[i] = results[i].replace(/style="([^"]*)"/g, function (z) { return z.toLowerCase() })

		// finally replace the existing tag with the new tag
		temphtml = temphtml.replace(original, results[i]);
	}
	// this strips out tbody tags.
	temphtml = temphtml.replace(/<\/?tbody>[^<]*/gi, "");
	return temphtml;
}