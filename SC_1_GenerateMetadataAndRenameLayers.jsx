
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
    alert("Layer names have been updated and metadata has been saved.");
} else {
    alert("No active document found.");
}
