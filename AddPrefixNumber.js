// Function to calculate the total number of layers
function countAllLayers(layerContainer) {
    var total = 0; // Use var for compatibility

    for (var i = 0; i < layerContainer.layers.length; i++) {
        var currentItem = layerContainer.layers[i];

        if (currentItem.typename === "ArtLayer") {
            total++; // Count the layer
        } else if (currentItem.typename === "LayerSet") {
            total += countAllLayers(currentItem); // Recursively count layers in the folder
        }
    }

    return total;
}

// Function to recursively process all layers and folders in reverse order
function addSequentialPrefixesReversed(layerContainer, prefixCounter) {
    for (var i = 0; i < layerContainer.layers.length; i++) {
        var currentItem = layerContainer.layers[i];

        if (currentItem.typename === "ArtLayer") {
            // If it's a layer, add a prefix in the format (-NUMBER)-
            currentItem.name = "(-" + prefixCounter.count + ")-" + currentItem.name;
            prefixCounter.count--; // Decrement the counter
        } else if (currentItem.typename === "LayerSet") {
            // If it's a folder, recursively process its contents
            addSequentialPrefixesReversed(currentItem, prefixCounter);
        }
    }
}

// Main function to process the active document
function addPrefixesToAllLayersReversed() {
    var doc = app.activeDocument;

    // Calculate the total number of layers to start the counter
    var totalLayers = countAllLayers(doc);

    var prefixCounter = { count: totalLayers }; // Start the counter from the total number of layers

    addSequentialPrefixesReversed(doc, prefixCounter); // Start processing layers
}

// Ensure there is an active document
if (app.documents.length > 0) {
    addPrefixesToAllLayersReversed();
} else {
    alert("No active document found.");
}
