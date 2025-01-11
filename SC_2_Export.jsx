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

    alert("Export complete! Layers have been saved to: " + docPath.fsName);
}

// Run the script
quickSaveAsOptimizedPNG();
