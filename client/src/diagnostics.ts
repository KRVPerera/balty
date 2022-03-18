/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */

import * as vscode from "vscode";

/** Code that is used to associate diagnostic entries with code actions. */
export const LABEL_ORDER = "labels_order";
export const LABEL_DUPLICATE = "duplicate_label";

/** String to detect in the text document. */
export const LABELS = "Labels:";

/**
 * Analyzes the text document for problems.
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param emojiDiagnostics diagnostic collection
 */
export function refreshDiagnostics(
  doc: vscode.TextDocument,
  emojiDiagnostics: vscode.DiagnosticCollection
): void {
  const diagnostics: vscode.Diagnostic[] = [];

  for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
    const lineOfText = doc.lineAt(lineIndex);
    if (lineOfText.text.includes(LABELS)) {
      const labels = lineOfText.text
        .substring(LABELS.length)
        .trim()
        .split(", ");

      checkDuplicateLabels(labels, doc, lineIndex, diagnostics);

      if (!isAlreadySorted(labels)) {
        diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex));
      }
    }
  }

  emojiDiagnostics.set(doc.uri, diagnostics);
}

function isAlreadySorted(labels: Array<string>) {
  for (let index = 1; index < labels.length; index++) {
    const elementA = labels[index - 1];
    const elementB = labels[index];
    if (greaterThan(elementA, elementB)) {
      return false;
    }
  }
  return true;
}

function greaterThan(stringA: string, stringB: string) {
  const stringALength = stringA.length;
  const stringBLength = stringB.length;
  const minLength = Math.min(stringALength, stringBLength);
  for (let index = 0; index < minLength; index++) {
    const elA = stringA.charCodeAt(index);
    const elB = stringB.charCodeAt(index);
    if (elA < elB) {
      return false;
    } else if (elA > elB) {
      return true;
    }
  }

  return false;
}

function createDiagnostic(
  doc: vscode.TextDocument,
  lineOfText: vscode.TextLine,
  lineIndex: number
): vscode.Diagnostic {
  // find where in the line of thet the 'emoji' is mentioned
  const index = lineOfText.text.indexOf(LABELS);

  // const start = range.start;
  // const line = doc.lineAt(start.line);
  const labelsLine = lineOfText.text;

  // if (isAlreadySorted(document, range)) {
  //   return;
  // }

  // create range that represents, where in the document the word is
  const range = new vscode.Range(
    lineIndex,
    index + LABELS.length,
    lineIndex,
    index + lineOfText.text.length
  );

  const diagnostic = new vscode.Diagnostic(
    range,
    "Labels are not sorted?",
    vscode.DiagnosticSeverity.Warning
  );
  diagnostic.code = LABEL_ORDER;
  return diagnostic;
}

export function subscribeToDocumentChanges(
  context: vscode.ExtensionContext,
  emojiDiagnostics: vscode.DiagnosticCollection
): void {
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(
      vscode.window.activeTextEditor.document,
      emojiDiagnostics
    );
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        refreshDiagnostics(editor.document, emojiDiagnostics);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      refreshDiagnostics(e.document, emojiDiagnostics)
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) =>
      emojiDiagnostics.delete(doc.uri)
    )
  );
}
function checkDuplicateLabels(
  labels: string[],
  doc: vscode.TextDocument,
  lineIndex: number,
  diagnostics: vscode.Diagnostic[]
) {
  if (labels.length == 0) {
    return;
  }
  const firstElement = labels[0];
  let currentLocation = LABELS.length + 1 + firstElement.length;
  const labelSet = new Set();
  labelSet.add(firstElement);

  for (let index = 1; index < labels.length; index++) {
    const element = labels[index];
    currentLocation += 2; // comma and space
    if (labelSet.has(element)) {
      // issue diagnostic

      // create range that represents, where in the document the word is
      const range = new vscode.Range(
        lineIndex,
        currentLocation,
        lineIndex,
        currentLocation + element.length
      );

      const el = element.toString();

      const diagnostic = new vscode.Diagnostic(
        range,
        `Duplicate label : '${element}'`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.code = LABEL_DUPLICATE;
      diagnostics.push(diagnostic);
    } else {
      labelSet.add(element);
    }
    currentLocation += element.length;
  }
}
