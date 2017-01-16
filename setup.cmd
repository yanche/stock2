
CALL npm install --no-optional

CALL typings install

CALL "./node_modules/.bin/tsc"

CALL grunt dev
