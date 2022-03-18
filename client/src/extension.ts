/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { commands, window, workspace, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { subscribeToDocumentChanges, LABEL_ORDER, LABELS } from "./diagnostics";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

function sortList(labels: Array<string>) {
  return labels.sort();
  // const sortedList: Array<string> = [];
  // for (let index = 0; index < labels.length; index++) {
  //   const elementA = labels[index];
  //   for (let indexJ = index + 1; indexJ < labels.length; indexJ++) {
  //     const elementB = labels[indexJ];
  //     if (greaterThan(elementA, elementB)) {
  //       sortedList.push(elementA);
  //     }
  //   }
  // }
  // return sortedList.join(", ").toString();
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

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "balt" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
    },
  };

  const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
  context.subscriptions.push(emojiDiagnostics);

  subscribeToDocumentChanges(context, emojiDiagnostics);

  // Create the language client and start the client.
  client = new LanguageClient("balt", "Balty", serverOptions, clientOptions);

  const disposable = commands.registerCommand(
    "balty.reorderLabels",
    function () {
      // Get the active text editor
      const editor = window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const selection = editor.selection;

        // Get the word within the selection
        const line = document
          .getText(selection)
          .replace(/^\s+|\s+$/g, "")
          .trim();
        const wordss = line.split(", ");
        const sorted = sortList(wordss);
        editor.edit((editBuilder) => {
          editBuilder.replace(selection, sorted.join(", "));
        });
      }
    }
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("balt", new Emojizer(), {
      providedCodeActionKinds: Emojizer.providedCodeActionKinds,
    })
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

/**
 * Provides code actions for converting :) to a smiley emoji.
 */
export class Emojizer implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] | undefined {
    if (!this.isAtStartOfSmiley(document, range)) {
      return;
    }

    // editor.edit((editBuilder) => {
    //   editBuilder.replace(selection, sorted.join(", "));
    // });

    const replaceWithSmileyFix = this.createFix(
      document,
      range,
      "Sort the labels"
    );
    replaceWithSmileyFix.isPreferred = true;

    return [replaceWithSmileyFix];
  }

  private isAtStartOfSmiley(
    document: vscode.TextDocument,
    range: vscode.Range
  ) {
    const start = range.start;
    const line = document.lineAt(start.line);
    return line.text.startsWith("Labels:");
  }

  private createFix(
    document: vscode.TextDocument,
    range: vscode.Range,
    emoji: string
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(
      `${emoji}`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = new vscode.WorkspaceEdit();

    const selection = document.lineAt(range.start);

    // // Get the word within the selection
    const noLabels = selection.text.substring(7);
    const line = noLabels.replace(/^\s+|\s+$/g, "").trim();
    const wordss = line.split(", ");
    const sorted = sortList(wordss);

    fix.edit.replace(
      document.uri,
      new vscode.Range(range.start, range.end),
      sorted.join(", ")
    );
    return fix;
  }
}
