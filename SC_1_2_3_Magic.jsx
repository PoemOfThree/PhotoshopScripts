
// --------------------------------------------------------------- Generate Metadata and rename layers ---------------------------------------------------------------

// JSON Polyfill for Photoshop scripting
var JSON = JSON || {};
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof obj;
    if (t != "object" || obj === null) {
        if (t == "string") obj = '"' + obj + '"';
        return String(obj);
    } else {
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n];
            t = typeof v;
            if (t == "string") v = '"' + v + '"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};

JSON.parse = JSON.parse || function (text) {
    try {
        return eval("(" + text + ")");
    } catch (e) {
        throw new Error("Invalid JSON: " + text);
    }
};

// Function to calculate the total number of layers
function countAllLayers(layerContainer) {
    var total = 0;

    for (var i = 0; i < layerContainer.layers.length; i++) {
        var currentItem = layerContainer.layers[i];

        if (currentItem.typename === "ArtLayer") {
            total++;
        } else if (currentItem.typename === "LayerSet") {
            total += countAllLayers(currentItem);
        }
    }

    return total;
}

// Function to recursively process all layers and folders in reverse order
function addSequentialZPositionsToMetadata(layerContainer, zCounter, metadata) {
    for (var i = 0; i < layerContainer.layers.length; i++) {
        var currentItem = layerContainer.layers[i];

        if (currentItem.typename === "ArtLayer") {
            var existingEntry = null;
            for (var j = 0; j < metadata.layers.length; j++) {
                if (metadata.layers[j].name === currentItem.name) {
                    existingEntry = metadata.layers[j];
                    break;
                }
            }

            if (existingEntry) {
                existingEntry.z = -zCounter.count;
            } else {
                metadata.layers.push({
                    name: currentItem.name,
                    z: -zCounter.count
                });
            }

            zCounter.count--;
        } else if (currentItem.typename === "LayerSet") {
            addSequentialZPositionsToMetadata(currentItem, zCounter, metadata);
        }
    }
}

// Function to add SortingLayer field based on folder name
function getSortingLayerFromParent(layer) {
    var sortingLayers = ["Background", "Ground", "Frontground"];
    var parent = layer.parent;

    while (parent && parent.typename === "LayerSet") {
        for (var i = 0; i < sortingLayers.length; i++) {
            // alert and break
            // alert(parent.name)
            if (sortingLayers[i] === parent.name) {
                return parent.name;
            }
        }
        parent = parent.parent;
    }

    // return null;
}

// First script: update metadata with Z positions
function updateMetadataWithZPositions() {
    var doc = app.activeDocument;
    var docFolder = doc.path;
    var docName = getMetadataFileName();
    if (!docFolder) {
        alert("The document must be saved before running this script.");
        return;
    }

    var jsonFile = File(docFolder + "/" + docName + ".json");
    var metadata = { layers: [] };
    if (jsonFile.exists) {
        jsonFile.open("r");
        try {
            metadata = JSON.parse(jsonFile.read());
        } catch (e) {
            alert("Failed to parse existing metadata.json. Starting with a new file.");
            metadata = { layers: [] };
        }
        jsonFile.close();
    }

    var totalLayers = countAllLayers(doc);
    var zCounter = { count: totalLayers };

    addSequentialZPositionsToMetadata(doc, zCounter, metadata);

    jsonFile.open("w");
    jsonFile.write(JSON.stringify(metadata, null, 2));
    jsonFile.close();
}

// Second script: save layer metadata with subfolders
function saveLayerMetadataWithSubfoldersXYName() {
    var doc = app.activeDocument;
    var docFolder = doc.path;
    var docName = getMetadataFileName();
    if (!docFolder) {
        alert("The document must be saved before running this script.");
        return;
    }

    var docWidth = doc.width.as("px");
    var docHeight = doc.height.as("px");
    var docCenterX = docWidth / 2;
    var docCenterY = docHeight / 2;

    var metadata = [];

    function processLayers(layers, docCenterX, docCenterY, metadata) {
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layer.typename === "ArtLayer" && layer.kind === LayerKind.NORMAL) {
                var bounds = layer.bounds;
                var layerLeft = bounds[0].as("px");
                var layerTop = bounds[1].as("px");
                var layerRight = bounds[2].as("px");
                var layerBottom = bounds[3].as("px");

                var layerCenterX = (layerLeft + layerRight) / 2;
                var layerCenterY = (layerTop + layerBottom) / 2;

                var relativeX = layerCenterX - docCenterX;
                var relativeY = -(layerCenterY - docCenterY);

                var sortingLayer = getSortingLayerFromParent(layer);

                var layerData = {
                    id: layer.id,
                    name: layer.name,
                    SortingLayer: sortingLayer,
                    x: relativeX,
                    y: relativeY,
                };

                metadata.push(layerData);
            } else if (layer.typename === "LayerSet") {
                processLayers(layer.layers, docCenterX, docCenterY, metadata);
            }
        }
    }

    processLayers(doc.layers, docCenterX, docCenterY, metadata);

    var jsonFile = File(docFolder + "/" + docName + ".json");
    jsonFile.open("w");
    jsonFile.write(JSON.stringify({ layers: metadata }, null, 2));
    jsonFile.close();
}

// metadata file name
function getMetadataFileName() {
    var doc = app.activeDocument;
    var docFolder = doc.path;
    var docName = doc.name.replace(/\.[^\.]+$/, "");
    return docName;
}

// --------------------------------------------------------------- rename layers ---------------------------------------------------------------
// Function to recursively rename visible layers in folders with reversed consecutive order
function renameVisibleLayersInFolders(root, fileName, layerCount) {
    for (var i = root.layers.length - 1; i >= 0; i--) {
        var layer = root.layers[i];
        if (layer.typename === 'ArtLayer' && layer.visible) {
            // Set the new layer name with the global random hash and folder names
            var newLayerName = fileName;
            layer.name = newLayerName + '_id(' + layer.id + ")" + "_metadata(" + getMetadataFileName() + ")";
            layerCount++;
        } else if (layer.typename === 'LayerSet') {
            // Recursively call for subfolders
            layerCount = renameVisibleLayersInFolders(layer, fileName, layerCount);
        }
    }
    return layerCount;
}

// Function to rename visible layers in root hierarchy and folders
function renameVisibleLayers() {
    // Get the active document
    var doc = app.activeDocument;

    // Get the file name in snake case without spaces
    var fileName = doc.name.replace(/\.[^\.]+$/, '').toLowerCase().replace(/\s+/g, '_');

    // Get all visible layers and layer sets in the root hierarchy
    var layerCount = 1; // Start counting from 1
    for (var i = doc.layers.length - 1; i >= 0; i--) {
        var layer = doc.layers[i];
        if (layer.typename === 'ArtLayer' && layer.visible) {
            // Set the new layer name with the global random hash
            var newLayerName = fileName + '_' + 'so_' + layerCount;
            layer.name = newLayerName + '_id(' + layer.id + ")" + "_metadata(" + getMetadataFileName() + ")";
            layerCount++;
        } else if (layer.typename === 'LayerSet' && layer.visible) {
            // Call the function to rename layers in folders
            layerCount = renameVisibleLayersInFolders(layer, fileName, layerCount);
        }
    }
}

// Ensure there is an active document
if (app.documents.length > 0) {
    renameVisibleLayers();
    saveLayerMetadataWithSubfoldersXYName();
    updateMetadataWithZPositions();
} else {
    alert("No active document found.");
}

// --------------------------------------------------------------- Export Layers as Optimized PNG ---------------------------------------------------------------

function quickSaveAsOptimizedPNG() {
    // Ensure there is a document open
    if (!app.documents.length) {
        alert("No document is open. Please open a PSD/PSB file and try again.");
        return;
    }

    var doc = app.activeDocument;
    var docPath = doc.path; // The path to save the PNGs
    if (!docPath) {
        alert("Please save your document before running this script.");
        return;
    }

    // Recursive function to export layers
    function exportLayers(layers) {
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layer.typename === "ArtLayer" && layer.visible) {
                // Save the layer as an optimized PNG
                saveLayerAsOptimizedPNG(layer, docPath);
            } else if (layer.typename === "LayerSet" && layer.visible) {
                // Process the layers inside the group
                exportLayers(layer.layers);
            }
        }
    }

    // Function to save an individual layer as an optimized PNG
    function saveLayerAsOptimizedPNG(layer, path) {
        var fileName = path + "/" + sanitizeFileName(layer.name) + ".png";

        // Create a new temporary document
        var tempDoc = app.documents.add(doc.width, doc.height, doc.resolution, "TempDoc", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

        // Duplicate the layer to the temporary document
        app.activeDocument = doc; // Ensure the original document is frontmost
        layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

        // Switch to the temporary document and trim transparency
        app.activeDocument = tempDoc;
        tempDoc.trim(TrimType.TRANSPARENT);

        // Save as PNG with optimized compression
        var pngFile = new File(fileName);
        var saveOptions = new ExportOptionsSaveForWeb(); // Use Save for Web options
        saveOptions.format = SaveDocumentType.PNG;
        saveOptions.PNG8 = false; // Use 24-bit PNG
        saveOptions.transparency = true;
        saveOptions.interlaced = false;
        saveOptions.quality = 100; // Set maximum quality

        tempDoc.exportDocument(pngFile, ExportType.SAVEFORWEB, saveOptions);

        // Close the temporary document
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);

        // Return focus to the original document
        app.activeDocument = doc;
    }

    // Function to sanitize file names
    function sanitizeFileName(name) {
        return name.replace(/[\/\\:*?"<>|]/g, "_");
    }

    // Start exporting layers
    exportLayers(doc.layers);
}

// Run the script
quickSaveAsOptimizedPNG();

// --------------------------------------------------------------- Resize Folder Same quality ---------------------------------------------------------------

// Define the desired size that should be divisible by 4
var desiredSize = 4.0;

// Get the folder of the currently active file or prompt the user if no file is open
var activeDocument = app.documents.length > 0 ? app.activeDocument : null;
var folder = activeDocument
    ? new Folder(activeDocument.path)
    : Folder.selectDialog("Select a folder containing PNG files to modify");

if (!folder || !folder.exists) {
    alert("No valid folder selected. Script terminated.");
    exit();
}

// Initialize an array to hold PNG files
var files = [];

// Recursive function to get all files in subfolders
function getFilesInSubfolders(folder) {
    var subFiles = folder.getFiles();
    for (var i = 0; i < subFiles.length; i++) {
        var subFile = subFiles[i];
        if (subFile instanceof Folder) {
            getFilesInSubfolders(subFile);
        } else if (subFile instanceof File && subFile.name.match(/\.png$/i)) {
            files.push(subFile);
        }
    }
}

// Populate the array with all PNG files in the folder and subfolders
getFilesInSubfolders(folder);

// Check if any files were found
if (files.length === 0) {
    alert("No PNG files found in the selected folder. Script terminated.");
    exit();
}

// Process each PNG file
for (var i = 0; i < files.length; i++) {
    try {
        var file = files[i];

        // Open the file
        var doc = open(file);

        // Calculate the new dimensions divisible by 4
        var newWidth = Math.ceil(doc.width / desiredSize) * desiredSize;
        var newHeight = Math.ceil(doc.height / desiredSize) * desiredSize;

        // Add extra pixels if necessary
        if (newWidth > doc.width || newHeight > doc.height) {
            doc.resizeCanvas(newWidth, newHeight, AnchorPosition.TOPLEFT);
        }

        // Convert the image to 8-bit/channel
        doc.bitsPerChannel = BitsPerChannelType.EIGHT;

        // Set export options for PNG
        var options = new ExportOptionsSaveForWeb();
        options.format = SaveDocumentType.PNG;
        options.PNG8 = false;
        options.dither = Dither.NONE;
        options.useICCProfile = false;
        options.compression = 9;
        options.transparency = true;

        // Save the compressed image in the same location, overwriting the original
        doc.exportDocument(file, ExportType.SAVEFORWEB, options);

        // Close the document without saving changes
        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (error) {
        alert("An error occurred while processing file: " + file.name + "\n" + error.message);
    }
}

// Notify the user when processing is complete
alert("Processing complete. Modified " + files.length + " PNG file(s).");
