#!/usr/bin/env sh

curl "https://raw.githubusercontent.com/ballerina-platform/ballerina-grammar/master/syntaxes/ballerina.YAML-tmLanguage" -O
rm -f ballerina.tmLanguage.json
npx js-yaml ballerina.YAML-tmLanguage > ballerina.tmLanguage.json
rm ballerina.YAML-tmLanguage
