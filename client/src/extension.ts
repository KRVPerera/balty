/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { commands, window, workspace, ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { subscribeToDocumentChanges, EMOJI_MENTION } from "./diagnostics";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

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
        const line = document.getText(selection).replace(/^\s+|\s+$/g, "");
        const wordss = line
          .split(",")
          .map((word) => {
            return word.replace(/^\s+|\s+$/g, "");
          })
          .sort()
          .join(", ");
        console.log(wordss);
        editor.edit((editBuilder) => {
          editBuilder.replace(selection, wordss);
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
    vscode.CodeActionKind.Refactor,
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] | undefined {
    if (!this.isAtStartOfSmiley(document, range)) {
      return;
    }

    if (this.isAlreadySorted(document, range)) {
      return;
    }

    const replaceWithSmileyCatFix = this.createFix(document, range, "😺");
    const replaceWithSmileyFix = this.createFix(document, range, "😀");
    replaceWithSmileyFix.isPreferred = true;
    const replaceWithSmileyHankyFix = this.createFix(document, range, "💩");

    return [
      replaceWithSmileyCatFix,
      replaceWithSmileyFix,
      replaceWithSmileyHankyFix,
    ];
  }

  isAlreadySorted(document: vscode.TextDocument, range: vscode.Range) {
    const start = range.start;
    const line = document.lineAt(start.line);
    const labelsLine = line.text;
    console.log(labelsLine);
    return false;
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
      `Convert to ${emoji}`,
      vscode.CodeActionKind.Refactor
    );
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(
      document.uri,
      new vscode.Range(range.start, range.start.translate(0, 2)),
      emoji
    );
    return fix;
  }
}
