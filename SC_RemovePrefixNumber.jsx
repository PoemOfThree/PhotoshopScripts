// Function to remove prefixes from layer names recursively
function removePrefixesFromGroup(group) {
    // Loop through each layer in the group
    for (var i = 0; i < group.artLayers.length; i++) {
        var currentLayer = group.artLayers[i];
        // Remove everything before and including the first closing parenthesis
        currentLayer.name = currentLayer.name.replace(/^\(.*?\)-/, "");
    }

    // Process subgroups recursively
    for (var j = 0; j < group.layerSets.length; j++) {
        removePrefixesFromGroup(group.layerSets[j]);
    }
}

// Function to remove prefixes from all layers in the active document
function removePrefixes() {
    var doc = app.activeDocument;

    // Remove prefixes from top-level layers
    for (var i = 0; i < doc.artLayers.length; i++) {
        var currentLayer = doc.artLayers[i];
        currentLayer.name = currentLayer.name.replace(/^\(.*?\)-/, "");
    }

    // Remove prefixes from groups
    for (var j = 0; j < doc.layerSets.length; j++) {
        removePrefixesFromGroup(doc.layerSets[j]);
    }
}

// Ensure there is an active document
if (app.documents.length > 0) {
    removePrefixes();
} else {
    alert("No active document found.");
}
