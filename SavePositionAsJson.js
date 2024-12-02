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

// Function to calculate bounds relative to the document center
function saveLayerMetadataWithCenterBounds() {
    var doc = app.activeDocument;
    var docFolder = doc.path; // Get the folder of the active document
    var docName = doc.name.replace(/\.[^\.]+$/, ""); // Remove file extension
    if (!docFolder) {
        alert("The document must be saved before running this script.");
        return;
    }

    // Calculate the document center
    var docWidth = doc.width.as("px");
    var docHeight = doc.height.as("px");
    var docCenterX = docWidth / 2;
    var docCenterY = docHeight / 2;

    var metadata = []; // Array to store layer data

    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.kind == LayerKind.NORMAL) {
            // Get layer bounds
            var bounds = layer.bounds;
            var layerLeft = bounds[0].as("px");
            var layerTop = bounds[1].as("px");
            var layerRight = bounds[2].as("px");
            var layerBottom = bounds[3].as("px");

            // Calculate layer center
            var layerCenterX = (layerLeft + layerRight) / 2;
            var layerCenterY = (layerTop + layerBottom) / 2;

            // Calculate position relative to document center
            var relativeX = layerCenterX - docCenterX;
            var relativeY = -(layerCenterY - docCenterY); // Invert Y to match Unity's coordinate system

            // Add layer data to metadata
            metadata.push({
                name: layer.name,
                x: relativeX,
                y: relativeY
            });
        }
    }

    // Save metadata as JSON in the same folder as the .psb file
    var jsonFile = File(docFolder + "/metadata.json");
    jsonFile.open("w");
    jsonFile.write(JSON.stringify({ layers: metadata }, null, 2)); // Wrap metadata in "layers"
    jsonFile.close();

    alert("Metadata saved successfully as " + "metadata" + ".json!");
}

// Run the function
saveLayerMetadataWithCenterBounds();
