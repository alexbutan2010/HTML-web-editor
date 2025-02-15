let codeMirror;
const preview = document.getElementById('preview');

// Initialize CodeMirror
document.addEventListener('DOMContentLoaded', () => {
    codeMirror = CodeMirror.fromTextArea(document.getElementById('editor'), {
        mode: 'htmlmixed',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        viewportMargin: Infinity,
        scrollbarStyle: 'native',
        fixedGutter: true,
        gutters: ["CodeMirror-linenumbers"],
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Tab': function(cm) {
                if (cm.state.completionActive) {
                    const hints = document.querySelector('.CodeMirror-hints');
                    if (hints) {
                        const firstItem = hints.querySelector('li');
                        if (firstItem) {
                            firstItem.click();
                            updatePreview(); // Update preview after insertion
                        }
                        return;
                    }
                }
                cm.showHint({completeSingle: false});
            },
            'Alt-Enter': function(cm) {
                cm.replaceSelection('\n');
                updatePreview(); // Update preview after newline
            },
            'Enter': function(cm) {
                if (cm.state.completionActive) {
                    cm.state.completionActive.close();
                    updatePreview(); // Update preview after closing hints
                }
            }
        },
        hintOptions: {
            completeSingle: false,
            hint: htmlHint,
            alignWithWord: true,
            closeCharacters: /[\s()\[\]{};:>,]/,
            closeOnUnfocus: true,
            selectOnTab: true,
            keys: ['Tab', 'Right', 'Left', 'Up', 'Down', 'Ctrl-Space']
        }
    });

    // Force a refresh after initialization
    setTimeout(() => {
        codeMirror.refresh();
    }, 100);

    // Make suggestions appear immediately when typing and update preview
    codeMirror.on("keyup", function(cm, event) {
        if (!cm.state.completionActive && 
            !/^Key.*$/.test(event.code) && 
            event.key !== 'Shift' && 
            event.key !== 'Control' && 
            event.key !== 'Alt') {
            cm.showHint({ completeSingle: false });
        }
        updatePreview(); // Ensure preview updates on every keyup
    });

    // Update preview on changes
    codeMirror.on('change', updatePreview);
    
    // Initially hide toolbar
    const toolbar = document.querySelector('.toolbar');
    const triggerBox = document.querySelector('.toolbar-trigger');

    // Ensure toolbar is initially hidden
    toolbar.classList.remove('visible');
    toolbar.classList.add('hidden');

    // Show toolbar when mouse enters trigger box
    triggerBox.addEventListener('mouseenter', () => {
        toolbar.classList.remove('hidden');
        toolbar.classList.add('visible');
    });

    // Hide toolbar when mouse leaves trigger box
    triggerBox.addEventListener('mouseleave', () => {
        toolbar.classList.remove('visible');
        toolbar.classList.add('hidden');
    });

    // Additional mouse movement handling
    document.addEventListener('mousemove', (e) => {
        const windowHeight = window.innerHeight;
        const mouseY = e.clientY;

        if (mouseY > windowHeight - 100) { // Increased detection zone
            toolbar.classList.remove('hidden');
            toolbar.classList.add('visible');
        } else {
            toolbar.classList.remove('visible');
            toolbar.classList.add('hidden');
        }
    });
});

// Function to handle mouse movement
function handleMouseMove(e) {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const toolbar = document.querySelector('.toolbar');

    if (mouseY > windowHeight - 60) { // Increased detection zone
        toolbar.classList.add('visible'); // Show toolbar when mouse is near the bottom
    } else {
        toolbar.classList.remove('visible'); // Hide toolbar when mouse is not near the bottom
    }
}

// Add helper functions for auto-completion
function completeAfter(cm, pred) {
    if (!pred || pred()) setTimeout(function() {
        if (!cm.state.completionActive)
            cm.showHint({completeSingle: false});
    }, 100);
    return CodeMirror.Pass;
}

function completeIfAfterLt(cm) {
    return completeAfter(cm, function() {
        var cur = cm.getCursor();
        return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) == '<';
    });
}

function completeIfInTag(cm) {
    return completeAfter(cm, function() {
        var tok = cm.getTokenAt(cm.getCursor());
        if (tok.type == "string" && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1)) return false;
        var inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
        return inner.tagName;
    });
}

// Custom HTML hint function
function htmlHint(cm) {
    const commonAttributes = [
        // Global attributes
        'accesskey', 'class', 'contenteditable', 'dir', 'hidden', 'id', 'lang',
        'spellcheck', 'style', 'tabindex', 'title', 'translate',
        // Form attributes
        'action', 'method', 'name', 'type', 'value', 'placeholder', 'required',
        'readonly', 'disabled', 'checked', 'maxlength', 'minlength', 'max', 'min',
        'pattern', 'autocomplete', 'autofocus', 'form', 'list', 'multiple',
        // Media attributes
        'src', 'alt', 'href', 'target', 'rel', 'media', 'controls', 'autoplay',
        'loop', 'muted', 'preload', 'poster', 'width', 'height',
        // Table attributes
        'colspan', 'rowspan', 'headers', 'scope',
        // ARIA attributes
        'role', 'aria-label', 'aria-describedby', 'aria-hidden',
        // Event handlers
        'onclick', 'onchange', 'onsubmit', 'onkeyup', 'onkeydown', 'onmouseover',
        'onmouseout', 'onfocus', 'onblur'
    ];

    const commonTags = [
        // Document structure
        'html', 'head', 'body', 'meta', 'title', 'link', 'script', 'style',
        // Text content
        'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'article', 'section', 'nav', 'aside', 'header', 'footer', 'main',
        'address', 'blockquote', 'dd', 'dl', 'dt', 'figcaption', 'figure',
        'hr', 'li', 'ol', 'ul', 'pre', 'code',
        // Forms
        'form', 'input', 'textarea', 'button', 'select', 'option', 'optgroup',
        'label', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter',
        // Links
        'a', 'link', 'nav',
        // Images and multimedia
        'img', 'picture', 'source', 'video', 'audio', 'track', 'map', 'area',
        'canvas', 'svg',
        // Tables
        'table', 'caption', 'th', 'tr', 'td', 'thead', 'tbody', 'tfoot', 'col',
        'colgroup',
        // Interactive elements
        'details', 'dialog', 'menu', 'summary',
        // Semantic elements
        'article', 'aside', 'footer', 'header', 'nav', 'section', 'time',
        'mark', 'ruby', 'rt', 'rp', 'bdi', 'wbr', 'embed', 'object', 'param'
    ];

    const cssProperties = {
        // Layout
        'display': ['block', 'inline', 'flex', 'grid', 'none', 'inline-block'],
        'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
        'float': ['left', 'right', 'none'],
        'clear': ['left', 'right', 'both', 'none'],
        'visibility': ['visible', 'hidden', 'collapse'],
        'overflow': ['visible', 'hidden', 'scroll', 'auto'],
        
        // Box model
        'margin': ['0', 'auto', '10px', '1rem', '2em'],
        'padding': ['0', '10px', '1rem', '2em'],
        'width': ['auto', '100%', '50%', '200px', 'fit-content'],
        'height': ['auto', '100%', '50%', '200px', 'fit-content'],
        
        // Typography
        'font-family': ['Arial', 'Helvetica', 'sans-serif', 'serif', 'monospace'],
        'font-size': ['12px', '14px', '16px', '1rem', '1.2em', 'larger'],
        'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700'],
        'text-align': ['left', 'center', 'right', 'justify'],
        'line-height': ['1', '1.5', '2', 'normal'],
        
        // Colors and backgrounds
        'color': ['black', 'white', 'red', 'blue', 'green', 'transparent', '#000', '#fff'],
        'background': ['none', 'transparent', 'white', 'black', '#fff', '#000'],
        'background-color': ['transparent', 'white', 'black', '#fff', '#000'],
        'background-image': ['none', 'url()', 'linear-gradient()'],
        
        // Border and outline
        'border': ['none', '1px solid black', '2px dashed red'],
        'border-radius': ['0', '5px', '10px', '50%'],
        'box-shadow': ['none', '0 0 5px rgba(0,0,0,0.3)', 'inset 0 0 5px black'],
        
        // Flexbox
        'flex-direction': ['row', 'column', 'row-reverse', 'column-reverse'],
        'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
        'align-items': ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
        'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
        'gap': ['0', '10px', '1rem', '20px'],
        
        // Grid
        'grid-template-columns': ['auto', '1fr', 'repeat(3, 1fr)', '100px 1fr'],
        'grid-template-rows': ['auto', '1fr', 'repeat(3, 1fr)', '100px 1fr'],
        'grid-gap': ['0', '10px', '1rem', '20px'],
        
        // Transitions and animations
        'transition': ['none', 'all 0.3s ease', 'opacity 0.5s linear'],
        'transform': ['none', 'scale(1.1)', 'rotate(45deg)', 'translate(10px, 20px)'],
        'animation': ['none', 'spin 1s linear infinite'],
        
        // Other
        'opacity': ['0', '0.5', '1'],
        'cursor': ['default', 'pointer', 'text', 'not-allowed', 'grab'],
        'z-index': ['0', '1', '10', '100', '-1'],

        // Shadows and Effects
        'text-shadow': [
            'none',
            '1px 1px 2px black',
            '0 0 3px #FF0000',
            '2px 2px 4px rgba(0,0,0,0.5)',
            '0 0 5px blue, 0 0 10px red',
            '2px 2px #000',
            '1px 1px white'
        ],
        'box-shadow': [
            'none',
            '0 0 5px rgba(0,0,0,0.3)',
            'inset 0 0 5px black',
            '3px 3px 5px #888888',
            '0 0 10px red',
            '5px 5px 5px rgba(0,0,0,0.2)',
            'inset 0 0 10px rgba(0,0,0,0.5)',
            '0 0 20px rgba(0,123,255,0.5)',
            '0 4px 8px rgba(0,0,0,0.1)',
            'rgba(0, 0, 0, 0.35) 0px 5px 15px',
            'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px'
        ],
        'filter': [
            'none',
            'blur(5px)',
            'brightness(150%)',
            'contrast(200%)',
            'drop-shadow(2px 2px 2px #000)',
            'grayscale(100%)',
            'sepia(100%)',
            'invert(100%)',
            'hue-rotate(90deg)',
            'opacity(50%)'
        ],
        'backdrop-filter': [
            'none',
            'blur(10px)',
            'brightness(60%)',
            'contrast(40%)',
            'grayscale(100%)',
            'blur(5px) brightness(75%)'
        ]
    };

    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const pos = cursor.ch;
    let start = pos;
    let end = pos;

    while (start && /[\w\.-]/.test(line.charAt(start - 1))) start--;
    while (end < line.length && /[\w\.-]/.test(line.charAt(end))) end++;

    const word = line.slice(start, end).toLowerCase();
    const styleAttributeRegex = /style=["'][^"']*$/;
    const isInStyleAttribute = styleAttributeRegex.test(line.slice(0, start));

    // Check if we're inside a style attribute
    if (isInStyleAttribute) {
        const properties = Object.keys(cssProperties);
        let suggestions = properties.filter(prop => prop.startsWith(word));

        // Check if we're after a property and colon
        const beforeCursor = line.slice(0, start);
        const propertyMatch = beforeCursor.match(/[\w-]+\s*:\s*$/);
        
        if (propertyMatch) {
            const property = propertyMatch[0].replace(/\s*:\s*$/, '');
            if (cssProperties[property]) {
                suggestions = cssProperties[property].filter(value => 
                    value.startsWith(word)
                );
            }
        }

        return {
            list: suggestions,
            from: CodeMirror.Pos(cursor.line, start),
            to: CodeMirror.Pos(cursor.line, end)
        };
    }

    // Regular tag or attribute hints
    const isTag = line.charAt(start - 1) === '<';
    let list = isTag ? commonTags : commonAttributes;
    list = list.filter(item => item.toLowerCase().startsWith(word));

    // Add special handling for style attribute
    if (!isTag) {
        list = list.map(item => {
            if (item === 'style') {
                return {
                    text: 'style=""',
                    displayText: 'style',
                    hint: (cm, data, completion) => {
                        cm.replaceRange(completion.text, data.from, data.to);
                        cm.setCursor(cm.getCursor().line, cm.getCursor().ch - 1); // Move cursor inside quotes
                        cm.showHint({ completeSingle: false }); // Show CSS property hints
                    }
                };
            }
            return item;
        });
    }

    // Custom function to apply inline styles
    function applyInlineStyle(cm, property, value) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const styleMatch = line.match(/style\s*=\s*["']([^"']*)/);

        // Enhanced RGB color parsing
        function parseColor(colorValue) {
            // Check for RGB format
            const rgbMatch = colorValue.match(/^(\d+)\s*(\d+)\s*(\d+)$/);
            if (rgbMatch) {
                const [, r, g, b] = rgbMatch;
                return `rgb(${r}, ${g}, ${b})`;
            }
            
            // Check for RGBA format
            const rgbaMatch = colorValue.match(/^(\d+)\s*(\d+)\s*(\d+)\s*([01](?:\.\d+)?)$/);
            if (rgbaMatch) {
                const [, r, g, b, a] = rgbaMatch;
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
            
            // Return original value if no special parsing needed
            return colorValue;
        }

        // Parse and normalize the color
        const parsedValue = parseColor(value);

        if (styleMatch) {
            const existingStyle = styleMatch[1];
            const styleRegex = new RegExp(`(${property}\\s*:\\s*)([^;]*)`);
            const newStyle = existingStyle.replace(styleRegex, `$1${parsedValue}`);

            // Replace the entire style attribute
            const fullLineReplacement = line.replace(
                /style\s*=\s*["'][^"']*["']/,
                `style="${newStyle}"`
            );
            
            cm.replaceRange(fullLineReplacement, 
                {line: cursor.line, ch: 0}, 
                {line: cursor.line, ch: line.length}
            );

            // Apply color to the text in the editor
            if (property === 'color') {
                const from = {line: cursor.line, ch: line.indexOf('>') + 1};
                const to = {line: cursor.line, ch: line.indexOf('<', from.ch)};
                
                cm.markText(from, to, {
                    css: `color: ${parsedValue}`
                });
            }
        } else {
            // If no style attribute exists, add a new one
            cm.replaceRange(` style="${property}: ${parsedValue}"`, 
                {line: cursor.line, ch: line.length}
            );
        }

        updatePreview(); // Update preview after style change
    }

    // Modify the hint selection to support inline style application
    return {
        list: list,
        from: CodeMirror.Pos(cursor.line, start),
        to: CodeMirror.Pos(cursor.line, end),
        hint: (cm, data, completion) => {
            // Check if we're in a style attribute
            const line = cm.getLine(data.from.line);
            const styleAttributeRegex = /style=["'][^"']*$/;
            
            if (styleAttributeRegex.test(line.slice(0, data.from.ch))) {
                // If it's a color value, apply the color
                if (completion.text.match(/^(red|blue|green|yellow|purple|orange|black|white|#[0-9a-fA-F]{3,6})$/)) {
                    applyInlineStyle(cm, 'color', completion.text);
                    return;
                }
            }

            // Default hint behavior
            cm.replaceRange(completion.text, data.from, data.to);
        }
    };
}

function updatePreview() {
    const content = codeMirror.getValue();
    const previewDocument = preview.contentDocument;
    
    // Enhanced color parsing function
    function parseColor(colorValue) {
        // Check for RGB format
        const rgbMatch = colorValue.match(/^(\d+)\s*(\d+)\s*(\d+)$/);
        if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            return `rgb(${r}, ${g}, ${b})`;
        }
        
        // Check for RGBA format
        const rgbaMatch = colorValue.match(/^(\d+)\s*(\d+)\s*(\d+)\s*([01](?:\.\d+)?)$/);
        if (rgbaMatch) {
            const [, r, g, b, a] = rgbaMatch;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        
        // Return original value if no special parsing needed
        return colorValue;
    }

    // Ensure preview is completely reset
    previewDocument.open();
    
    // Modify content to ensure proper HTML parsing
    let modifiedContent = content;
    
    // Fix unclosed style attributes
    modifiedContent = modifiedContent.replace(
        /style\s*=\s*"([^"]*)/g, 
        (match, p1) => `style="${p1.replace(/;?\s*$/, '')}""`
    );
    
    // Ensure proper HTML structure if missing
    if (!modifiedContent.match(/<html/i)) {
        modifiedContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
    ${modifiedContent}
</body>
</html>`;
    }

    previewDocument.write(modifiedContent);
    previewDocument.close();

    // Process inline styles with color
    const elementsWithStyle = previewDocument.querySelectorAll('[style*="color"]');
    elementsWithStyle.forEach(element => {
        const styleAttr = element.getAttribute('style');
        const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/);
        
        if (colorMatch) {
            const originalColor = colorMatch[1].trim();
            const parsedColor = parseColor(originalColor);
            
            // Replace the color in the style attribute
            element.setAttribute('style', 
                styleAttr.replace(/color\s*:\s*[^;]+/, `color: ${parsedColor}`)
            );
        }
    });
    
    // Fix for body attributes
    const bodyMatch = content.match(/<body[^>]*>/i);
    if (bodyMatch) {
        const bgColorMatch = bodyMatch[0].match(/bgcolor=['"]([^'"]*)['"]/i);
        const backgroundMatch = bodyMatch[0].match(/background=['"]([^'"]*)['"]/i);
        
        if (bgColorMatch) {
            previewDocument.body.style.backgroundColor = parseColor(bgColorMatch[1]);
        }
        if (backgroundMatch) {
            previewDocument.body.style.backgroundImage = `url(${backgroundMatch[1]})`;
        }
    }
}

function saveContent() {
    const content = codeMirror.getValue();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    a.click();
    URL.revokeObjectURL(url);
}

function loadContent() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            codeMirror.setValue(e.target.result);
            updatePreview();
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearEditor() {
    codeMirror.setValue('');
    updatePreview();
}

function togglePreview() {
    const preview = document.getElementById('preview');
    const container = document.querySelector('.container');
    preview.classList.toggle('hidden');
    container.classList.toggle('preview-hidden');
    
    // Trigger CodeMirror refresh to adjust size
    setTimeout(() => {
        codeMirror.refresh();
    }, 300); // match transition duration
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            document.body.classList.remove('fullscreen');
        }
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen');
    }
});

// Update runCode function to not affect toolbar visibility
function runCode() {
    document.body.classList.add('runtime-mode');
    const runtimeToolbar = document.querySelector('.runtime-toolbar');
    const runtimeTriggerBox = document.querySelector('.runtime-toolbar-trigger');

    // Reset any existing event listeners
    const oldTriggerBox = runtimeTriggerBox.cloneNode(true);
    runtimeTriggerBox.parentNode.replaceChild(oldTriggerBox, runtimeTriggerBox);

    // Ensure runtime toolbar is initially hidden
    runtimeToolbar.classList.remove('visible');
    runtimeToolbar.classList.add('hidden');

    // Debounce function to prevent rapid triggering
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Setup runtime toolbar trigger with debounce
    const debouncedMouseEnter = debounce(() => {
        runtimeToolbar.classList.remove('hidden');
        runtimeToolbar.classList.add('visible');
    }, 50);

    const debouncedMouseLeave = debounce(() => {
        runtimeToolbar.classList.remove('visible');
        runtimeToolbar.classList.add('hidden');
    }, 50);

    // Add event listeners with debounce
    oldTriggerBox.addEventListener('mouseenter', debouncedMouseEnter);
    oldTriggerBox.addEventListener('mouseleave', debouncedMouseLeave);

    // Mouse movement handling for runtime mode
    const runtimeMouseMoveHandler = (e) => {
        const windowHeight = window.innerHeight;
        const mouseY = e.clientY;

        if (mouseY > windowHeight - 100) { // Increased detection zone
            runtimeToolbar.classList.remove('hidden');
            runtimeToolbar.classList.add('visible');
        } else {
            runtimeToolbar.classList.remove('visible');
            runtimeToolbar.classList.add('hidden');
        }
    };

    // Add mouse movement listener
    document.addEventListener('mousemove', runtimeMouseMoveHandler);

    // Store the runtime mouse move handler to remove it later
    this.runtimeMouseMoveHandler = runtimeMouseMoveHandler;

    // Ensure preview is shown
    if (preview.classList.contains('hidden')) {
        togglePreview();
    }
    updatePreview();
}

function exitRunMode() {
    document.body.classList.remove('runtime-mode');
    const runtimeToolbar = document.querySelector('.runtime-toolbar');
    const runtimeTriggerBox = document.querySelector('.runtime-toolbar-trigger');

    // Remove runtime-specific event listeners
    if (this.runtimeMouseMoveHandler) {
        document.removeEventListener('mousemove', this.runtimeMouseMoveHandler);
    }

    // Reset runtime toolbar visibility
    runtimeToolbar.classList.remove('visible');
    runtimeToolbar.classList.add('hidden');

    // Reset trigger box
    runtimeTriggerBox.replaceWith(runtimeTriggerBox.cloneNode(true));
    
    setTimeout(() => {
        codeMirror.refresh();
    }, 100);
}

function toggleRuntimeFullscreen() {
    const preview = document.getElementById('preview');
    
    if (!document.fullscreenElement) {
        preview.requestFullscreen();
        document.body.classList.add('runtime-fullscreen');
    } else {
        document.exitFullscreen();
        document.body.classList.remove('runtime-fullscreen');
    }
}

// Add fullscreen change listener for runtime mode
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('runtime-fullscreen');
    }
});
