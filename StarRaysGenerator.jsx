/*
    Star Rays Generator Script for Adobe Illustrator
    --------------------------------------
    This script generates random "starburst" lines radiating from the center of selected objects
    or the document center (if no objects are selected).
    
    Usage with selection:
    - Select objects with stroke colors to use their colors for the rays.
    - Run the script. If selected objects have no stroke color, random colors will be applied.

    Usage no  selection:
    - Run the script.
    - Set options in dialog
    
    Compatibility: Tested with Adobe Illustrator CC 2024
    Author: Magnus Hållberg
*/
(function (){
    // Reference to the active document and selection
    var doc = app.activeDocument;
    var sel = doc.selection;

    // Default document center point
    var width = doc.width;
    var height = doc.height;
    var centerPoint = { x: width / 2, y: -height / 2 };

    // Default settings
    var linesCount = 50;
    var lineWidth = 1;
    var minMaxRadius = { min: 0, max: 200, maxSliderValue: width / 2 };
    var colorValue = { r: 0, g: 0, b: 0, maxSliderValue: 255 };
    var opacity = { value: "20", maxSliderValue: 100 };

    // Blending modes
    function chooseBlendModeFrom(index) {
        switch(index) {
            case 0: return BlendModes.NORMAL;
            case 1: return BlendModes.MULTIPLY;
            case 2: return BlendModes.SCREEN; 
            case 3: return BlendModes.OVERLAY; 
            case 4: return BlendModes.SOFTLIGHT;
            case 5: return BlendModes.HARDLIGHT;
            case 6: return BlendModes.DARKEN;
            case 7: return BlendModes.LIGHTEN;
            case 8: return BlendModes.DIFFERENCE;
            case 9: return BlendModes.EXCLUSION;
            case 10: return BlendModes.HUE;
            case 11: return BlendModes.SATURATION;
            case 12: return BlendModes.COLOR;
            case 13: return BlendModes.LUMINOSITY;
        }
    }
    var blendModeNames = [
        "Normal",
        "Multiply",
        "Screen",
        "Overlay",
        "Soft Light",
        "Hard Light",
        "Darken",
        "Lighten",
        "Difference",
        "Exclusion",
        "Hue",
        "Saturation",
        "Color",
        "Luminosity"
    ];

    var selectedBlendMode = BlendModes.NORMAL;

    function validateSelection(selection) {
        if (!selection || selection.length === 0) {
            return false; // No objects are selected
        }
        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            if (!item.stroked || item.strokeColor.typename === "NoColor") {
                return false; // Invalid if any item is missing a stroke color
            }
        }
        return true; // All items have valid stroke colors
    }

    /**
    * Displays the dialog for user inputs
    */
    function showDialog() {
        var hasValidStrokes = sel.length > 0 && validateSelection(sel);
        var win = new Window("dialog", "Star Rays", undefined, { closeButton: true });

        // Main panel to contain all UI elements
        var mainPanel = win.add("panel", undefined, "Settings");
        mainPanel.alignChildren = "fill";

        // Warning panel for invalid selection
        if (!hasValidStrokes && sel.length > 0) {
            var warningPanel = mainPanel.add("panel", undefined, "Warning");
            warningPanel.add("statictext", undefined, "Some selected objects lack stroke colors.");
            warningPanel.add("statictext", undefined, "Random light colors will be applied.");
        }
        
        // Ray count group
        var rayCountGroup = mainPanel.add("panel", undefined, "Number of Rays");
        rayCountGroup.alignChildren = "fill";
        rayCountGroup.amountText = rayCountGroup.add("edittext", undefined, linesCount);
        rayCountGroup.amountSlider = rayCountGroup.add("slider", undefined, linesCount, 0, 3000);

        // Radius and color settings (if no selection)
        if (sel.length <= 0) {
            var radiusPanel = mainPanel.add("panel", undefined, "Min and Max Radius");
            radiusPanel.alignChildren = "fill";
            radiusPanel.minSlider = radiusPanel.add("slider", undefined, minMaxRadius.min, 0, minMaxRadius.maxSliderValue);
            radiusPanel.maxSlider = radiusPanel.add("slider", undefined, minMaxRadius.max, 0, minMaxRadius.maxSliderValue);

            var colorRangePanel = mainPanel.add("panel", undefined, "Color Settings");
            colorRangePanel.alignChildren = "fill";

            // Color preview panel
            var colorPreviewPanel = colorRangePanel.add("panel", undefined, "Color Preview");
            colorPreviewPanel.preferredSize = [150, 50];
            updatePreview(colorValue.r, colorValue.g, colorValue.b);

            // RGB sliders and labels
            var rGroup = colorRangePanel.add("group");
            rGroup.add("statictext", undefined, "R:");
            var rSlider = rGroup.add("slider", undefined, colorValue.r, 0, colorValue.maxSliderValue);

            var gGroup = colorRangePanel.add("group");
            gGroup.add("statictext", undefined, "G:");
            var gSlider = gGroup.add("slider", undefined, colorValue.g, 0, colorValue.maxSliderValue);

            var bGroup = colorRangePanel.add("group");
            bGroup.add("statictext", undefined, "B:");
            var bSlider = bGroup.add("slider", undefined, colorValue.b, 0, colorValue.maxSliderValue);
        }

        // Line width settings
        var lineWidthPanel = mainPanel.add("panel", undefined, "Line width");
        lineWidthPanel.alignChildren = "fill";
        lineWidthPanel.widthText = lineWidthPanel.add("edittext", undefined, lineWidth);
        lineWidthPanel.widthSlider = lineWidthPanel.add("slider", undefined, lineWidth, 1, 30);

        // Opacity settings
        var opacityPanel = mainPanel.add("panel", undefined, "Opacity");
        opacityPanel.alignChildren = "fill";
        opacityPanel.opacitySlider = opacityPanel.add("slider", undefined, opacity.value, 0, opacity.maxSliderValue);

        // Blend mode dropdown
        var blendModePanel = mainPanel.add("panel", undefined, "Blending Mode");
        blendModePanel.alignChildren = "fill";
        var blendList = blendModePanel.add("dropdownlist", undefined, blendModeNames);
        blendList.selection = 0;

        // Buttons
        var btnGroup = mainPanel.add("group");
        var okBtn = btnGroup.add("button", undefined, "OK");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        // Event handlers
        if (sel.length <= 0) {
            radiusPanel.minSlider.onChange = function () {
                minMaxRadius.min = parseInt(radiusPanel.minSlider.value);
            };
            radiusPanel.maxSlider.onChange = function () {
                minMaxRadius.max = parseInt(radiusPanel.maxSlider.value);
            };
            rSlider.onChange = function () {
                colorValue.r = parseInt(rSlider.value);
                updatePreview(colorValue.r, colorValue.g, colorValue.b);
            };
            gSlider.onChange = function () {
                colorValue.g = parseInt(gSlider.value);
                updatePreview(colorValue.r, colorValue.g, colorValue.b);
            };
            bSlider.onChange = function () {
                colorValue.b = parseInt(bSlider.value);
                updatePreview(colorValue.r, colorValue.g, colorValue.b);
            };
        }
        lineWidthPanel.widthText.onChange = function () {
            lineWidth = parseInt(lineWidthPanel.widthText.text);
        };
        lineWidthPanel.widthSlider.onChange = function () {
            lineWidth = parseInt(lineWidthPanel.widthSlider.value);
            lineWidthPanel.widthText.text = parseInt(lineWidthPanel.widthSlider.value);
        };
        opacityPanel.opacitySlider.onChange = function () {
            opacity.value = parseInt(opacityPanel.opacitySlider.value);
        };
        rayCountGroup.amountSlider.onChange = function () {
            linesCount = parseInt(rayCountGroup.amountSlider.value);
            rayCountGroup.amountText.text = linesCount;
        };
        rayCountGroup.amountText.onChange = function () {
            linesCount = parseInt(rayCountGroup.amountText.text);
        };
        blendList.onChange = function () {
            selectedBlendMode = chooseBlendModeFrom(blendList.selection.index);
        };

        // Update color preview
        function updatePreview(r, g, b) {
            colorPreviewPanel.graphics.backgroundColor = colorPreviewPanel.graphics.newBrush(
                colorPreviewPanel.graphics.BrushType.SOLID_COLOR,
                [r / 255, g / 255, b / 255, 1] // Normalize RGB to 0-1 range
            );
        }

        // Button actions
        cancelBtn.onClick = function () {
            win.close();
        };
        okBtn.onClick = function () {
            if (sel.length > 0) {
                for (var i = 0; i < sel.length; i++) {
                    createLines(sel[i], i);
                }
            } else {
                createLines();
            }
            win.close();
        };

        win.show();
    }


    /**
    * Creates lines originating from the center of a selected object or document
    * @param {PageItem} selected - The selected object (optional)
    */
    function createLines(selected, index) {
        if (selected) {
            centerPoint.x = selected.position[0] + selected.width / 2;
            centerPoint.y = selected.position[1] - selected.height / 2;
            minMaxRadius.max = selected.width / 2;

            if (selected.stroked && selected.strokeColor.typename !== "NoColor") {
                var selColor = getRGBFromStrokeColor(selected);
                colorValue.r = selColor.r;
                colorValue.g = selColor.g;
                colorValue.b = selColor.b;
            } else {
                // Assign random light colors if no stroke color is present
                colorValue.r = Math.random() * 255;
                colorValue.g = Math.random() * 255;
                colorValue.b = Math.random() * 255;
            }
        }

        // Create the outer points of the formation
        var outerPoints = [];
        for (var i = 0; i < linesCount; i++) {
            var angle = Math.random() * Math.PI * 2;
            var radius = minMaxRadius.min + Math.random() * (minMaxRadius.max - minMaxRadius.min);
            var x = centerPoint.x + radius * Math.cos(angle);
            var y = centerPoint.y + radius * Math.sin(angle);
            outerPoints.push([x, y]);
        }

        // Index is undefined if no target objects are selected
        if (index === undefined) {
            index = 0;
        }

        // Create a new layer for the rays
        var newLayer = doc.layers.add();
        newLayer.name = "Ray layer - " + (index + 1);

        // Create the lines of the formation and group them
        var group = doc.activeLayer.groupItems.add();
        
        for (var j = 0; j < outerPoints.length; j++) {
            group.name = "Ray formation - " + (index + 1);
            var line = group.pathItems.add();
            line.setEntirePath([[centerPoint.x, centerPoint.y], outerPoints[j]]);
            line.stroked = true;

            var hsl = rgbToHsl(colorValue.r, colorValue.g, colorValue.b);
            hsl.l = Math.random() * 100; // Random lightness
            var randomizedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);

            var color = new RGBColor();
            color.red = randomizedRgb.r;
            color.green = randomizedRgb.g;
            color.blue = randomizedRgb.b;
            line.strokeColor = color;

            line.opacity = parseInt(opacity.value, 10);
            line.blendingMode = selectedBlendMode;
            line.filled = false;
            line.strokeWidth = lineWidth;
        }
    }

    /**
    * Extracts RGB values from an object's stroke color, converting any color space to RGB
    * @param {PageItem} item - The Illustrator object
    * @returns {Object} - { r: number, g: number, b: number }
    */
    function getRGBFromStrokeColor(item) {
        if (!item || !item.stroked) {
            throw new Error("The object has no stroke or is invalid.");
        }

        var color = item.strokeColor;
        var rgb = { r: 0, g: 0, b: 0 };

        if (color.typename === "RGBColor") {
            rgb.r = color.red;
            rgb.g = color.green;
            rgb.b = color.blue;
        } else if (color.typename === "CMYKColor") {
            rgb.r = 255 * (1 - color.cyan / 100) * (1 - color.black / 100);
            rgb.g = 255 * (1 - color.magenta / 100) * (1 - color.black / 100);
            rgb.b = 255 * (1 - color.yellow / 100) * (1 - color.black / 100);
        } else if (color.typename === "SpotColor") {
            var spotColor = color.spot.color;
            if (spotColor.typename === "RGBColor") {
                rgb.r = spotColor.red;
                rgb.g = spotColor.green;
                rgb.b = spotColor.blue;
            } else if (spotColor.typename === "CMYKColor") {
                rgb.r = 255 * (1 - spotColor.cyan / 100) * (1 - spotColor.black / 100);
                rgb.g = 255 * (1 - spotColor.magenta / 100) * (1 - spotColor.black / 100);
                rgb.b = 255 * (1 - spotColor.yellow / 100) * (1 - spotColor.black / 100);
            }
        } else if (color.typename === "GrayColor") {
            var grayValue = color.gray;
            rgb.r = rgb.g = rgb.b = 255 * (1 - grayValue / 100);
        } else {
            throw new Error("Unsupported color type: " + color.typename);
        }

        rgb.r = Math.round(Math.min(Math.max(rgb.r, 0), 255));
        rgb.g = Math.round(Math.min(Math.max(rgb.g, 0), 255));
        rgb.b = Math.round(Math.min(Math.max(rgb.b, 0), 255));

        return rgb;
    }

    /**
    * Converts RGB to HSL
    * @param {number} r - Red (0-255)
    * @param {number} g - Green (0-255)
    * @param {number} b - Blue (0-255)
    * @returns {Object} - { h: number, s: number, l: number }
    */
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    /**
    * Converts HSL to RGB
    * @param {number} h - Hue (0-360)
    * @param {number} s - Saturation (0-100)
    * @param {number} l - Lightness (0-100)
    * @returns {Object} - { r: number, g: number, b: number }
    */
    function hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        var r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function (p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    
    // Start the script
    showDialog();
})();