// Create empty folders in the current Photoshop document
function createFolders() {
    // Check if there's an open document
    if (!app.documents.length) {
        alert("Please open a PSB file to run this script.");
        return;
    }

    // Names of the folders to create
    var folderNames = ["Background", "Ground", "Foreground"];

    // Create each folder
    for (var i = 0; i < folderNames.length; i++) {
        var folder = app.activeDocument.layerSets.add();
        folder.name = folderNames[i];
    }

    alert("Folders created successfully!");
}

// Run the function
createFolders();
