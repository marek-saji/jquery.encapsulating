YUICOMPRESSOR=yuicompressor.sh
LESSC=lessc.sh

all: jquery.encapsulating.min.js jquery.encapsulating.min.css

jquery.encapsulating.css: jquery.encapsulating.less
	$(LESSC) jquery.encapsulating.less > jquery.encapsulating.css

jquery.encapsulating.min.css: jquery.encapsulating.css
	$(YUICOMPRESSOR) jquery.encapsulating.css > jquery.encapsulating.min.css

jquery.encapsulating.min.js: jquery.encapsulating.js
	$(YUICOMPRESSOR) jquery.encapsulating.js > jquery.encapsulating.min.js

clean:
	-rm -f jquery.encapsulating.{min.{js,css},css}

