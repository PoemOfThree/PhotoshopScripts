// Function to rename layers
function renameLayers() {
    // Get the number of layers
    var layerCount = app.activeDocument.artLayers.length;

    // Loop through each layer and rename it
    for (var i = 0; i < layerCount; i++) {
        var currentLayer = app.activeDocument.artLayers[i];
        var newValue = -layerCount + (i + 1);
        currentLayer.name = "(" + newValue + ")-" + currentLayer.name;
    }
}

// Ensure there is an active document
if (app.documents.length > 0) {
    renameLayers();
} else {
    alert("No active document found.");
}

