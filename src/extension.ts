import * as vscode from 'vscode';

const path = require('path');
const fs =require('fs');

export function activate(context: vscode.ExtensionContext) {
	let currentPanel: vscode.WebviewPanel | undefined = undefined;

	let disposable = vscode.commands.registerCommand('icones.find', () => {

		const columnToShowIn = vscode.window.activeTextEditor
		? vscode.window.activeTextEditor.viewColumn
		: undefined;

		if (currentPanel) {
			// If we already have a panel, show it in the target column
			currentPanel.reveal(columnToShowIn);
		} else {
			// Otherwise, create a new panel

			const htmlPath = path.join(context.extensionPath, 'web', 'dist', 'index.html');

       currentPanel = vscode.window.createWebviewPanel(
        'icones', // Identifies the type of the webview. Used internally
        'Icônes', // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        {
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [vscode.Uri.file(path.dirname(htmlPath))]
				}
			);
			
			currentPanel.webview.html = getHtml4Path(htmlPath, currentPanel);

			// Reset when the current panel is closed
			currentPanel.onDidDispose(
				() => {
					currentPanel = undefined;
				},
				null,
				context.subscriptions
			);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

// https://github.com/leocll/vscode-extension-webview-template/blob/master/src/vscode/vscode.webview.js
function getHtml4Path(htmlPath: string, panel: vscode.WebviewPanel) {
	const scheme = panel.webview.cspSource ? panel.webview.cspSource.split(':')[0] : 'vscode-resource';
	const dirPath = path.dirname(htmlPath);
	let html = fs.readFileSync(htmlPath, 'utf-8');
	// @ts-ignore
	html = html.replace(/(href=|src=)(.+?)(\ |>)/g, (m, $1, $2, $3) => {
			let uri = $2;
			uri = uri.replace('"', '').replace("'", '');
			uri.indexOf('/') === 0 && (uri = `.${uri}`);
			if (uri.substring(0, 1) === ".") {
					const furi = vscode.Uri.file(path.resolve(dirPath, uri));
					if (panel.webview.asWebviewUri) {
							uri = `${$1}${panel.webview.asWebviewUri(furi)}${$3}`;
					} else {
							uri = `${$1}${furi.with({ scheme }).toString()}${$3}`;
					}
					return uri.replace('%22', '');
			}
			return m;
	});

	html = html.replace(/<head>/gm, () =>	`<head>
		<script>
			window.staticURI = "${panel.webview.asWebviewUri(vscode.Uri.file(path.resolve(dirPath)))}"
			window.baseURI = '/electron-browser/index.html/'
		</script>
	`);

	return html;
}