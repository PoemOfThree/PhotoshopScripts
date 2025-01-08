// Function to duplicate layer with suffix
function duplicateLayerWithSuffix(suffix) {
    var doc = app.activeDocument;
    var layer = doc.activeLayer;
    var layerName = layer.name;
    var newLayer = layer.duplicate();
    
    // Append suffix to layer name
    newLayer.name = layerName + "_" + suffix;
}

// Array of suffixes
var suffixes = ["schinese", "spanish", "italian", "english", "koreana", "german", "polish", "brazilian", "ukrainian", "japanese", "french"];

// Duplicate layer with each suffix
for (var i = 0; i < suffixes.length; i++) {
    duplicateLayerWithSuffix(suffixes[i]);
}
