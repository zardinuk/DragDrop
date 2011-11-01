
CSS_MIN = yui-compressor
CSS_MIN_FLAGS = --type css

JS_MIN = uglifyjs
JS_MIN_FLAGS = --unsafe --no-copyright

CSS_PATH = ./css
CSS_FILES = ${CSS_PATH}/shThemeEclipse.css\
	${CSS_PATH}/shCoreEclipse.css\
	${CSS_PATH}/style.css

CSS_MIN_FILE = style.min.css

JS_PATH = ./js
JS_FILES = ${JS_PATH}/XRegExp.js\
	${JS_PATH}/shCore.js\
	${JS_PATH}/shBrushBash.js\
	${JS_PATH}/shBrushJScript.js\
	${JS_PATH}/control.js
	
JS_MIN_FILE = control.min.js

build: css-files js-files

css-files:
	cat ${CSS_FILES} | ${CSS_MIN} ${CSS_MIN_FLAGS} > ${CSS_MIN_FILE}

js-files:
	cat ${JS_FILES} | ${JS_MIN} ${JS_MIN_FLAGS} > ${JS_MIN_FILE}

clean:
	rm -f ${CSS_MIN_FILE}
	rm -f ${JS_MIN_FILE}

