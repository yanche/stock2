
CALL npm install --no-optional

CALL bower install

CALL typings install

CALL "./node_modules/.bin/tsc"

CALL grunt dev
