// Function to generate a random secure hash
function generateRandomHash() {
    // Implement your secure hash generation logic here
    // For simplicity, I'm using a basic random string as an example
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var hash = '';
    for (var i = 0; i < 8; i++) {
        hash += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return hash;
}

// Generate a single random hash for all layers
var globalRandomHash = generateRandomHash();

// Function to recursively rename visible layers in folders with reversed consecutive order
function renameVisibleLayersInFolders(root, fileName, parentFolderNames, layerCount) {
    for (var i = root.layers.length - 1; i >= 0; i--) {
        var layer = root.layers[i];
        if (layer.typename === 'ArtLayer' && layer.visible) {
            // Set the new layer name with the global random hash and folder names
            var newLayerName = fileName + '_' + parentFolderNames + 'so_' + layerCount + '_' + globalRandomHash;
            layer.name = newLayerName;
            layerCount++;
        } else if (layer.typename === 'LayerSet') {
            // Recursively call for subfolders
            var folderName = parentFolderNames + layer.name + '_';
            layerCount = renameVisibleLayersInFolders(layer, fileName, folderName, layerCount);
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
            var newLayerName = fileName + '_' + 'so_' + layerCount + '_' + globalRandomHash;
            layer.name = newLayerName;
            layerCount++;
        } else if (layer.typename === 'LayerSet' && layer.visible) {
            // Call the function to rename layers in folders
            layerCount = renameVisibleLayersInFolders(layer, fileName, layer.name + '_', layerCount);
        }
    }
}

// Call the function to rename visible layers
renameVisibleLayers();
