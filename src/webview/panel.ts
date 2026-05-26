import * as vscode from 'vscode';
import * as fs from 'fs';

// Singleton para el highlighter de shiki para mejorar el rendimiento
let shikiHighlighter: any = null;

async function getHighlighter() {
    if (!shikiHighlighter) {
        try {
            const { createHighlighter } = await import('shiki');
            shikiHighlighter = await createHighlighter({
                themes: PRESETS.map(p => p.shikiTheme),
                langs: [
                    'javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 
                    'rust', 'c', 'cpp', 'java', 'go', 'php', 'sql', 'yaml', 'bash', 'shell',
                    'ruby', 'swift', 'kotlin', 'dart', 'csharp', 'lua', 'perl', 'dockerfile',
                    'jsx', 'tsx', 'vue', 'svelte', 'jsonc', 'less', 'sass', 'scss', 'xml',
                    'ini', 'makefile', 'cmake', 'powershell', 'latex'
                ]
            });
        } catch (error) {
            console.error('Error al inicializar Shiki:', error);
            vscode.window.showErrorMessage(vscode.l10n.t('errorInitializingHighlighter', String(error)));
            throw error;
        }
    }
    return shikiHighlighter;
}

interface ThemePreset {
    id: string;
    label: string;
    icon: string;
    bg: string;
    shikiTheme: string;
    shadow: string;
}

interface QuickPreset {
    id: string;
    label: string;
    icon: string;
    config: Partial<{
        themeId: string;
        padding: number;
        shadow: number;
        fontSize: number;
        width?: number | string;
        aspectRatio?: string;
    }>;
}

const PRESETS: ThemePreset[] = [
    { id: 'dracula', label: 'Dracula', icon: '🌑', bg: '#282a36', shikiTheme: 'dracula', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'github', label: 'GitHub Dark', icon: '🌊', bg: '#0d1117', shikiTheme: 'github-dark', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'nord', label: 'Nord', icon: '🧊', bg: '#2e3440', shikiTheme: 'nord', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'sunset', label: 'Sunset', icon: '🔥', bg: 'linear-gradient(45deg, #ff5f6d, #ffc371)', shikiTheme: 'github-dark', shadow: '0 20px 50px rgba(0,0,0,0.3)' },
    { id: 'minimal', label: 'Minimal', icon: '🧼', bg: '#ffffff', shikiTheme: 'github-light', shadow: '0 20px 50px rgba(0,0,0,0.1)' },
    { id: 'tokyo-night', label: 'Tokyo Night', icon: '🌃', bg: '#1a1b26', shikiTheme: 'tokyo-night', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'one-dark', label: 'One Dark', icon: '🖤', bg: '#282c34', shikiTheme: 'one-dark-pro', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'monokai', label: 'Monokai', icon: '🍌', bg: '#272822', shikiTheme: 'monokai', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'rose-pine', label: 'Rosé Pine', icon: '🌹', bg: '#191724', shikiTheme: 'rose-pine', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'material-ocean', label: 'Material Ocean', icon: '🌊', bg: '#0f111a', shikiTheme: 'material-theme-ocean', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'vitesse-dark', label: 'Vitesse Dark', icon: '⚡', bg: '#121212', shikiTheme: 'vitesse-dark', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'vitesse-light', label: 'Vitesse Light', icon: '☀️', bg: '#ffffff', shikiTheme: 'vitesse-light', shadow: '0 20px 50px rgba(0,0,0,0.1)' },
    { id: 'catppuccin', label: 'Catppuccin', icon: '🐈', bg: '#1e1e2e', shikiTheme: 'catppuccin-mocha', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'rose-pine-moon', label: 'Rosé Moon', icon: '🌙', bg: '#232136', shikiTheme: 'rose-pine-moon', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'poimandres', label: 'Poimandres', icon: '🔮', bg: '#1b1e28', shikiTheme: 'poimandres', shadow: '0 20px 50px rgba(0,0,0,0.5)' }
];

const LOGOS = {
    X: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path></svg>`,
    GITHUB: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>`,
    META: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.062 10.334c-.217-2.126-1.391-4.148-3.303-5.69-1.93-1.558-4.482-2.316-6.732-2.316-2.25 0-4.802.758-6.732 2.316-1.912 1.542-3.086 3.564-3.303 5.69-.17 1.649.098 3.32.757 4.707.659 1.387 1.69 2.518 2.903 3.19 1.488.826 3.09 1.054 4.545.666 1.456-.387 2.766-1.395 3.52-2.82a20.016 20.016 0 0 0 1.056-2.29l.067-.168.067.168c.287.712.639 1.474 1.056 2.29.754 1.425 2.064 2.433 3.52 2.82 1.455.388 3.057.16 4.545-.666 1.213-.672 2.244-1.803 2.903-3.19.659-1.387.927-3.058.757-4.707zm-14.71 5.093c-1.637.382-3.41-.301-4.48-1.922-.533-.806-.856-1.848-.856-2.917s.323-2.111.856-2.917c1.07-1.621 2.843-2.304 4.48-1.922 1.637.382 3.409 2.112 4.48 4.839-1.07 2.727-2.843 4.457-4.48 4.839zm12.103-1.922c-1.07 1.621-2.843 2.304-4.48 1.922-1.637-.382-3.41-2.112-4.48-4.839 1.07-2.727 2.843-4.457 4.48-4.839 1.637-.382 3.41.301 4.48 1.922.533.806.856 1.848.856 2.917s-.323 2.111-.856 2.917z"></path></svg>`,
    TIKTOK: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31 0 2.57.17 3.77.49V5.1c-1.1-.31-2.2-.47-3.3-.47V.02zm6.75 4.54a7.3 7.3 0 0 1-4.75-2.04v7.03c0 3.54-2.87 6.41-6.41 6.41a6.41 6.41 0 0 1-6.41-6.41c0-3.54 2.87-6.41 6.41-6.41.34 0 .67.03 1 .08v4.54c-.33-.04-.66-.07-1-.07a1.87 1.87 0 0 0-1.87 1.87c0 1.03.84 1.87 1.87 1.87s1.87-.84 1.87-1.87V0h4.54a7.3 7.3 0 0 0 4.75 6.41v2.7c-1.31-.64-2.47-1.57-3.4-2.7v.15z"></path></svg>`
};

const QUICK_PRESETS: QuickPreset[] = [
    { 
        id: 'x_post', 
        label: 'X', 
        icon: LOGOS.X, 
        config: { 
            themeId: 'sunset', 
            padding: 80, 
            shadow: 40, 
            fontSize: 18,
            width: 1200,
            aspectRatio: '1200/630'
        } 
    },
    { 
        id: 'github_readme', 
        label: 'GitHub', 
        icon: LOGOS.GITHUB, 
        config: { 
            themeId: 'github', 
            padding: 40, 
            shadow: 20, 
            fontSize: 14,
            width: 800,
            aspectRatio: 'auto'
        } 
    },
    { 
        id: 'dark_export', 
        label: 'Dark High-Res', 
        icon: '🌑', 
        config: { 
            themeId: 'dracula', 
            padding: 64, 
            shadow: 80, 
            fontSize: 18,
            width: 'fit-content',
            aspectRatio: 'auto'
        } 
    },
    { 
        id: 'minimal_export', 
        label: 'Pure Minimal', 
        icon: '🧼', 
        config: { 
            themeId: 'minimal', 
            padding: 48, 
            shadow: 5, 
            fontSize: 15,
            width: 'fit-content',
            aspectRatio: 'auto'
        } 
    },
    { 
        id: 'meta', 
        label: 'META', 
        icon: LOGOS.META, 
        config: { 
            themeId: 'nord', 
            padding: 80, 
            shadow: 30, 
            fontSize: 16,
            width: 1200,
            aspectRatio: '1.91/1'
        } 
    },
    { 
        id: 'tiktok', 
        label: 'TikTok', 
        icon: LOGOS.TIKTOK, 
        config: { 
            themeId: 'sunset', 
            padding: 120, 
            shadow: 60, 
            fontSize: 20,
            width: 1080,
            aspectRatio: '9/16'
        } 
    }
];

export async function createPreviewPanel(extensionUri: vscode.Uri, code: string, language: string) {

    let state = {
        themeId: 'dracula',
        padding: 64,
        shadow: 50,
        borderRadius: 12,
        fontSize: 15,
        exportPreset: 2,
        showSidebar: true,
        width: 'fit-content' as number | string,
        aspectRatio: 'auto',
        windowTitle: 'AstroCode'
    };

    const panel = vscode.window.createWebviewPanel(
        'astrocodePreview',
        `AstroCode ${vscode.l10n.t('preview')}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        }
    );

    const update = async () => {
        try {
            const highlighter = await getHighlighter();
            panel.webview.html = await getHtml(panel.webview, extensionUri, code, language, state, highlighter);
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('errorRenderingPanel', String(error)));
        }
    };

    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'updateConfig':
                const needsReRender = message.config.themeId && message.config.themeId !== state.themeId;
                state = { ...state, ...message.config };
                if (needsReRender) {
                    await update();
                }
                break;
            case 'saveFile':
                const { data, extension, defaultName } = message;

                const workspaceFolders = vscode.workspace.workspaceFolders;
                const defaultUri = workspaceFolders
                    ? vscode.Uri.joinPath(workspaceFolders[0].uri, defaultName)
                    : undefined;

                const uri = await vscode.window.showSaveDialog({
                    defaultUri,
                    filters: { [vscode.l10n.t('files')]: [extension] },
                    saveLabel: vscode.l10n.t('saveCapture')
                });

                if (uri) {
                    fs.writeFileSync(uri.fsPath, Buffer.from(new Uint8Array(data)));
                    vscode.window.showInformationMessage(vscode.l10n.t('captureSavedSuccessfully', uri.fsPath));
                }
                break;
        }
    });

    await update();
}

async function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri, code: string, language: string, state: any, highlighter: any): Promise<string> {
    const preset = PRESETS.find(p => p.id === state.themeId) || PRESETS[0];

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'html-to-image.min.js'));

    const i18n = {
        settings: vscode.l10n.t('settings'),
        reset: vscode.l10n.t('reset'),
        quickPresets: vscode.l10n.t('quickPresets'),
        theme: vscode.l10n.t('theme'),
        padding: vscode.l10n.t('padding'),
        shadow: vscode.l10n.t('shadow'),
        borderRadius: vscode.l10n.t('borderRadius'),
        fontSize: vscode.l10n.t('fontSize'),
        exportQuality: vscode.l10n.t('exportQuality'),
        windowTitle: vscode.l10n.t('windowTitle'),
        errorExportingPng: vscode.l10n.t('errorExportingPng', '{0}')
    };

    let highlighted;
    try {
        highlighted = highlighter.codeToHtml(code, {
            lang: language,
            theme: preset.shikiTheme
        });
    } catch (e) {
        highlighted = highlighter.codeToHtml(code, {
            lang: 'text',
            theme: preset.shikiTheme
        });
    }

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; script-src ${webview.cspSource} 'unsafe-inline'; style-src 'unsafe-inline';">
<script src="${scriptUri}"></script>

<style>
    :root {
        --sidebar-width: 280px;
        --padding: ${state.padding}px;
        --shadow: ${state.shadow}px;
        --fontSize: ${state.fontSize}px;
        --borderRadius: ${state.borderRadius}px;
        --width: ${typeof state.width === 'number' ? state.width + 'px' : state.width};
        --aspect-ratio: ${state.aspectRatio};
    }
    * {
        box-sizing: border-box;
    }
    body {
        margin: 0;
        background: #050505;
        display: flex;
        height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #eee;
        overflow: hidden;
    }

    /* Layout */
    .main-content {
        flex: 1;
        overflow: auto;
        padding: 80px 40px;
        position: relative;
        display: block; /* Cambiamos a block para scroll natural */
    }

    .top-controls {
        position: fixed; /* Fixed para que no se mueva con el scroll */
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 100;
    }

    .export-btn {
        background: #fff;
        color: #000;
        border: none;
        padding: 10px 24px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.1s, background 0.2s;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); /* Sombra para que se vea sobre el código */
    }

    .export-btn:hover { transform: scale(1.05); background: #f0f0f0; }

    .toggle-sidebar {
        position: fixed;
        top: 20px;
        right: ${state.showSidebar ? 'calc(var(--sidebar-width) + 40px)' : '20px'};
        z-index: 10;
        background: #222;
        color: #fff;
        border: 1px solid #333;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: right 0.3s ease, background 0.2s;
    }

    .toggle-sidebar:hover { background: #333; }

    .sidebar {
        width: var(--sidebar-width);
        min-width: var(--sidebar-width);
        background: #111;
        border-left: 1px solid #222;
        padding: 24px 24px 100px 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        overflow-y: auto;
        transition: all 0.3s ease;
    }

    .sidebar.hidden {
        width: 0;
        min-width: 0;
        padding: 0;
        border: none;
        overflow: hidden;
    }

    h3 { margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #aaa; letter-spacing: 1px; }

    .config-group { display: flex; flex-direction: column; gap: 8px; }

    /* Controls */
    select, input[type="range"] {
        width: 100%;
        background: #222;
        border: 1px solid #333;
        color: #fff;
        padding: 8px;
        border-radius: 4px;
    }

    .range-label { display: flex; justify-content: space-between; font-size: 12px; color: #aaa; }

    .theme-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .theme-item {
        background: #222;
        border: 1px solid #333;
        padding: 12px 8px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 11px;
        text-align: center;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #aaa;
    }

    .theme-item .icon {
        font-size: 24px;
        line-height: 1;
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .theme-item .icon svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    .theme-item:hover {
        background: #2a2a2a;
        border-color: #444;
        color: #fff;
    }

    .theme-item.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
        color: #fff;
    }

    /* Preview Area */
    .card-container {
        padding: var(--padding);
        background: ${preset.bg};
        display: flex;
        justify-content: center;
        align-items: center;
        width: var(--width);
        aspect-ratio: var(--aspect-ratio);
        margin: 40px auto;
        border-radius: 4px;
        box-sizing: border-box;
        transition: all 0.3s ease;
    }

    .card {
        background: ${preset.shikiTheme.includes('light') ? '#ffffff' : '#0d1117'};
        border-radius: var(--borderRadius);
        box-shadow: 0 var(--shadow) calc(var(--shadow) * 2) rgba(0,0,0,0.5);
        overflow: hidden;
        transition: all 0.3s ease;
        width: fit-content;
    }

    .window-header {
        display: flex;
        padding: 16px;
        gap: 8px;
        background: rgba(255,255,255,0.03);
        align-items: center;
        position: relative;
    }

    .window-title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: rgba(255,255,255,0.4);
        font-family: sans-serif;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60%;
    }

    .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }

    .code-content { padding: 20px 24px 24px 24px; position: relative; }

    pre {
        margin: 0 !important;
        background: transparent !important;
        line-height: 1.5;
        white-space: pre;
    }

    code {
        font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
        font-size: var(--fontSize);
    }

    .shiki { background-color: transparent !important; padding: 0 !important; margin: 0 !important; }
    
    .line {
        background-color: transparent !important;
        display: block;
        min-height: 1em;
    }
    .reset-btn {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.2);
        color: #818cf8;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.2s;
    }

    .reset-btn:hover {
        background: rgba(99, 102, 241, 0.2);
        border-color: #6366f1;
        color: #fff;
    }
</style>

</head>

<body>

    <div class="main-content">
        <div class="top-controls">
            <button id="exportBtn" class="export-btn">📸 PNG</button>
        </div>
        <div class="toggle-sidebar" onclick="toggleSidebar()">
            ${state.showSidebar ? '→' : '←'}
        </div>

        <div id="captureArea" class="card-container">
            <div class="card">
                <div class="window-header">
                    <div class="dot red"></div>
                    <div class="dot yellow"></div>
                    <div class="dot green"></div>
                    <div id="windowTitleDisplay" class="window-title">${state.windowTitle}</div>
                </div>
                <div id="codeContainer" class="code-content">
                    ${highlighted}
                </div>
            </div>
        </div>
    </div>

    <div class="sidebar ${state.showSidebar ? '' : 'hidden'}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0;">${i18n.settings}</h3>
            <button onclick="resetConfig()" class="reset-btn">${i18n.reset}</button>
        </div>

        <div class="config-group">
            <h3>${i18n.quickPresets}</h3>
            <div class="theme-grid">
                ${QUICK_PRESETS.map(p => `
                    <div class="theme-item" onclick="applyQuickPreset('${p.id}')">
                        <div class="icon">${p.icon}</div>
                        <span>${p.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="config-group">
            <h3>${i18n.windowTitle}</h3>
            <input type="text" value="${state.windowTitle}" oninput="updateWindowTitle(this.value)" placeholder="Enter title..." style="width: 100%; background: #222; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 4px;">
        </div>

        <div class="config-group">
            <h3>${i18n.theme}</h3>
            <div class="theme-grid">
                ${PRESETS.map(p => `
                    <div class="theme-item ${p.id === state.themeId ? 'active' : ''}" onclick="updateConfig({themeId: '${p.id}'})">
                        <div class="icon">${p.icon}</div>
                        <span>${p.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>${i18n.padding}</h3>
                <span id="val-padding">${state.padding}px</span>
            </div>
            <input type="range" min="0" max="128" value="${state.padding}" oninput="localUpdate('padding', this.value)">
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>${i18n.shadow}</h3>
                <span id="val-shadow">${state.shadow}px</span>
            </div>
            <input type="range" min="0" max="100" value="${state.shadow}" oninput="localUpdate('shadow', this.value)">
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>${i18n.borderRadius}</h3>
                <span id="val-borderRadius">${state.borderRadius}px</span>
            </div>
            <input type="range" min="0" max="40" value="${state.borderRadius}" oninput="localUpdate('borderRadius', this.value)">
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>${i18n.fontSize}</h3>
                <span id="val-fontSize">${state.fontSize}px</span>
            </div>
            <input type="range" min="12" max="24" value="${state.fontSize}" oninput="localUpdate('fontSize', this.value)">
        </div>

        <div class="config-group">
            <h3>${i18n.exportQuality}</h3>
            <input type="range" min="1" max="4" value="${state.exportPreset}" oninput="updateConfig({exportPreset: parseInt(this.value)})">
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const exportBtn = document.getElementById("exportBtn");
        const captureArea = document.getElementById("captureArea");

        const i18n = ${JSON.stringify(i18n)};
        let config = ${JSON.stringify(state)};
        const quickPresets = ${JSON.stringify(QUICK_PRESETS)};

        function updateConfig(newConfig) {
            // Actualizar el estado local
            config = { ...config, ...newConfig };

            if (newConfig.windowTitle !== undefined) {
                document.getElementById('windowTitleDisplay').innerText = newConfig.windowTitle;
            }

            // Actualización instantánea de dimensiones y estilos
            if (newConfig.width !== undefined) {
                const w = typeof newConfig.width === 'number' ? newConfig.width + 'px' : newConfig.width;
                document.documentElement.style.setProperty('--width', w);
            }
            if (newConfig.aspectRatio !== undefined) {
                document.documentElement.style.setProperty('--aspect-ratio', newConfig.aspectRatio);
            }
            
            // Actualizar sliders y etiquetas si están presentes en newConfig
            ['padding', 'shadow', 'borderRadius', 'fontSize', 'exportPreset'].forEach(key => {
                if (newConfig[key] !== undefined) {
                    if (key !== 'exportPreset') {
                        document.documentElement.style.setProperty('--' + key, newConfig[key] + 'px');
                        const label = document.getElementById('val-' + key);
                        if (label) label.innerText = newConfig[key] + 'px';
                    }
                    const input = document.querySelector('input[oninput*="' + key + '"]');
                    if (input) input.value = newConfig[key];
                }
            });

            if (newConfig.themeId) {
                document.querySelectorAll('.theme-grid .theme-item').forEach(el => {
                    const onclick = el.getAttribute('onclick') || '';
                    if (onclick.includes('themeId')) {
                        el.classList.toggle('active', onclick.indexOf("'" + newConfig.themeId + "'") !== -1);
                    }
                });
            }

            vscode.postMessage({ command: 'updateConfig', config: newConfig });
        }

        function localUpdate(key, value) {
            const val = parseInt(value);
            config[key] = val;
            
            // Actualización instantánea via CSS Variables
            document.documentElement.style.setProperty('--' + key, val + 'px');
            document.getElementById('val-' + key).innerText = val + 'px';

            // Persistir cambios con debounce
            clearTimeout(window.saveTimer);
            window.saveTimer = setTimeout(() => {
                updateConfig({ [key]: val });
            }, 300);
        }

        function updateWindowTitle(value) {
            config.windowTitle = value;
            document.getElementById('windowTitleDisplay').innerText = value;
            
            clearTimeout(window.titleTimer);
            window.titleTimer = setTimeout(() => {
                updateConfig({ windowTitle: value });
            }, 300);
        }

        function resetConfig() {
            updateConfig({
                themeId: 'dracula',
                padding: 64,
                shadow: 50,
                borderRadius: 12,
                fontSize: 15,
                width: 'fit-content',
                aspectRatio: 'auto',
                windowTitle: 'AstroCode',
                showSidebar: true
            });
            
            // Actualizar inputs manualmente
            document.querySelector('input[oninput*="updateWindowTitle"]').value = 'AstroCode';
        }

        function applyQuickPreset(id) {
            const preset = quickPresets.find(p => p.id === id);
            if (preset) {
                updateConfig(preset.config);
            }
        }

        function toggleSidebar() {
            const newState = !config.showSidebar;
            const sidebar = document.querySelector('.sidebar');
            const toggleBtn = document.querySelector('.toggle-sidebar');
            
            if (newState) {
                sidebar.classList.remove('hidden');
                toggleBtn.style.right = 'calc(var(--sidebar-width) + 40px)';
                toggleBtn.innerText = '→';
            } else {
                sidebar.classList.add('hidden');
                toggleBtn.style.right = '20px';
                toggleBtn.innerText = '←';
            }
            
            updateConfig({ showSidebar: newState });
        }

        // Export PNG
        exportBtn.addEventListener("click", async () => {
            exportBtn.innerText = "⏳...";
            try {
                // Obtenemos el tamaño real del contenedor para la captura
                const width = captureArea.offsetWidth;
                const height = captureArea.offsetHeight;

                const dataUrl = await htmlToImage.toPng(captureArea, { 
                    pixelRatio: config.exportPreset || 2, 
                    width: width,
                    height: height,
                    style: {
                        margin: '0',
                        transform: 'none'
                    }
                });
                const base64Data = dataUrl.split(',')[1];
                const binaryData = atob(base64Data);
                const array = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    array[i] = binaryData.charCodeAt(i);
                }

                vscode.postMessage({
                    command: 'saveFile',
                    data: Array.from(array),
                    extension: 'png',
                    defaultName: 'astrocode-capture.png'
                });
            } catch (e) { console.error(e); alert(i18n.errorExportingPng.replace('{0}', e.message)); }
            exportBtn.innerText = "📸 PNG";
        });
    </script>

</body>
</html>
`;
}
