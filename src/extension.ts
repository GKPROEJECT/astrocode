import * as vscode from 'vscode';
import { createPreviewPanel } from './webview/panel';

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand(
        'astrocode.captureSelection',
        () => {

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No hay editor activo');
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            const language = editor.document.languageId;

            // Si no hay texto seleccionado
            if (!text || text.trim().length === 0) {
                vscode.window.showErrorMessage('Selecciona código primero');
                return;
            }

            // 🔥 AQUÍ está la magia: abrir preview
            createPreviewPanel(text, language);
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}