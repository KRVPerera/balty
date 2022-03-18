# Balty

This is a vscode extentsion under development to help Ballerina spec conformance test writers.

## Functionality

Currently only suppors `ballerina` syntax highlighting. Due to no clear start and end tokens to identify `ballerina` code block some parts of the test case header is also recognized as `ballerina`.

### Label Sorting

This is under development inspired by a gist created by
Author: Sandaru Jayawardana <https://github.com/SandaruJayawardana>
https://gist.github.com/SandaruJayawardana/6c91b947a418c75542ae73460f7492e0

You can reorder labels by selecting label list and choosing the command "Balty: Reorder Labels"

## Structure

This is created using vscode `lsp-example` thus there could be some artifact which are still belong to original project. Although language server is available no functionality is provided by the language server.

## Preview

![Screenshot 2021-10-19 at 11 24 19 AM](https://user-images.githubusercontent.com/2173530/137851773-4ec6eb98-69f7-49c7-bf52-266df57ffff1.png)
