import * as vscode from 'vscode';
import * as fs from 'fs';

// Singleton para el highlighter de shiki para mejorar el rendimiento
let shikiHighlighter: any = null;

async function getHighlighter() {
    if (!shikiHighlighter) {
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
    }
    return shikiHighlighter;
}

interface ThemePreset {
    id: string;
    label: string;
    bg: string;
    shikiTheme: string;
    shadow: string;
}

interface QuickPreset {
    id: string;
    label: string;
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
    { id: 'dracula', label: '🌑 Dracula', bg: '#282a36', shikiTheme: 'dracula', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'github', label: '🌊 GitHub Dark', bg: '#0d1117', shikiTheme: 'github-dark', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'nord', label: '🧊 Nord', bg: '#2e3440', shikiTheme: 'nord', shadow: '0 20px 50px rgba(0,0,0,0.5)' },
    { id: 'sunset', label: '🔥 Sunset', bg: 'linear-gradient(45deg, #ff5f6d, #ffc371)', shikiTheme: 'github-dark', shadow: '0 20px 50px rgba(0,0,0,0.3)' },
    { id: 'minimal', label: '🧼 Minimal', bg: '#ffffff', shikiTheme: 'github-light', shadow: '0 20px 50px rgba(0,0,0,0.1)' }
];

const QUICK_PRESETS: QuickPreset[] = [
    { 
        id: 'twitter', 
        label: '🐦 Twitter Card', 
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
        label: '📖 GitHub README', 
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
        label: '🌑 Dark High-Res', 
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
        label: '🧼 Pure Minimal', 
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
        id: 'facebook', 
        label: '👥 Facebook Post', 
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
        label: '📱 TikTok Video', 
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

export async function createPreviewPanel(code: string, language: string) {

    let state = {
        themeId: 'dracula',
        padding: 64,
        shadow: 50,
        fontSize: 15,
        exportPreset: 2,
        showSidebar: true,
        width: 'fit-content' as number | string,
        aspectRatio: 'auto'
    };

    const panel = vscode.window.createWebviewPanel(
        'astrocodePreview',
        'AstroCode Preview',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const update = async () => {
        const highlighter = await getHighlighter();
        panel.webview.html = await getHtml(code, language, state, highlighter);
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
                    filters: { 'Archivos': [extension] },
                    saveLabel: 'Guardar Captura'
                });

                if (uri) {
                    fs.writeFileSync(uri.fsPath, Buffer.from(new Uint8Array(data)));
                    vscode.window.showInformationMessage(`✅ Captura guardada con éxito en: ${uri.fsPath}`);
                }
                break;
        }
    });

    await update();
}

async function getHtml(code: string, language: string, state: any, highlighter: any): Promise<string> {
    const preset = PRESETS.find(p => p.id === state.themeId) || PRESETS[0];

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
<script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>

<style>
    :root {
        --sidebar-width: 280px;
        --padding: ${state.padding}px;
        --shadow: ${state.shadow}px;
        --fontSize: ${state.fontSize}px;
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
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        text-align: center;
        transition: all 0.2s;
    }

    .theme-item.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
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
        border-radius: 12px;
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
    }

    .dot { width: 12px; height: 12px; border-radius: 50%; }
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
                </div>
                <div id="codeContainer" class="code-content">
                    ${highlighted}
                </div>
            </div>
        </div>
    </div>

    <div class="sidebar ${state.showSidebar ? '' : 'hidden'}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0;">Ajustes</h3>
            <button onclick="resetConfig()" class="reset-btn">Reiniciar</button>
        </div>

        <div class="config-group">
            <h3>Presets Rápidos</h3>
            <div class="theme-grid">
                ${QUICK_PRESETS.map(p => `
                    <div class="theme-item" onclick="applyQuickPreset('${p.id}')">
                        ${p.label}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="config-group">
            <h3>Tema</h3>
            <div class="theme-grid">
                ${PRESETS.map(p => `
                    <div class="theme-item ${p.id === state.themeId ? 'active' : ''}" onclick="updateConfig({themeId: '${p.id}'})">
                        ${p.label}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>Padding</h3>
                <span id="val-padding">${state.padding}px</span>
            </div>
            <input type="range" min="0" max="128" value="${state.padding}" oninput="localUpdate('padding', this.value)">
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>Sombra</h3>
                <span id="val-shadow">${state.shadow}px</span>
            </div>
            <input type="range" min="0" max="100" value="${state.shadow}" oninput="localUpdate('shadow', this.value)">
        </div>

        <div class="config-group">
            <div class="range-label">
                <h3>Tamaño Fuente</h3>
                <span id="val-fontSize">${state.fontSize}px</span>
            </div>
            <input type="range" min="12" max="24" value="${state.fontSize}" oninput="localUpdate('fontSize', this.value)">
        </div>

        <div class="config-group">
            <h3>Export Quality</h3>
            <input type="range" min="1" max="4" value="${state.exportPreset}" oninput="updateConfig({exportPreset: parseInt(this.value)})">
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const exportBtn = document.getElementById("exportBtn");
        const captureArea = document.getElementById("captureArea");

        let config = ${JSON.stringify(state)};
        const quickPresets = ${JSON.stringify(QUICK_PRESETS)};

        function updateConfig(newConfig) {
            // Actualizar el estado local
            config = { ...config, ...newConfig };

            // Actualización instantánea de dimensiones y estilos
            if (newConfig.width !== undefined) {
                const w = typeof newConfig.width === 'number' ? newConfig.width + 'px' : newConfig.width;
                document.documentElement.style.setProperty('--width', w);
            }
            if (newConfig.aspectRatio !== undefined) {
                document.documentElement.style.setProperty('--aspect-ratio', newConfig.aspectRatio);
            }
            
            // Actualizar sliders y etiquetas si están presentes en newConfig
            ['padding', 'shadow', 'fontSize', 'exportPreset'].forEach(key => {
                if (newConfig[key] !== undefined) {
                    if (key !== 'exportPreset') {
                        document.documentElement.style.setProperty('--' + key, newConfig[key] + 'px');
                        const label = document.getElementById('val-' + key);
                        if (label) label.innerText = newConfig[key] + 'px';
                    }
                    const input = document.querySelector('input[oninput*="' + key + '"]');
                    if (input) (input as any).value = newConfig[key];
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

        function resetConfig() {
            updateConfig({
                themeId: 'dracula',
                padding: 64,
                shadow: 50,
                fontSize: 15,
                width: 'fit-content',
                aspectRatio: 'auto',
                showSidebar: true
            });
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
            } catch (e) { console.error(e); alert("Error al exportar PNG: " + e.message); }
            exportBtn.innerText = "📸 PNG";
        });
    </script>

</body>
</html>
`;
}
