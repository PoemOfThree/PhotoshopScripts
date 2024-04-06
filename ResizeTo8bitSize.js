// Enable 'Smaller File (8-bit)' option
var exportOptions = new ExportOptionsSaveForWeb();
exportOptions.format = SaveDocumentType.PNG;
exportOptions.PNG8 = true;

// Function to recursively process folders
function processFolder(folder) {
    var files = folder.getFiles();

    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        // If file is a PNG
        if (file instanceof File && file.name.match(/\.png$/i)) {
            open(file);

            // Export with smaller file (8-bit) option
            var exportFile = new File(file.path + "/" + file.name);
            activeDocument.exportDocument(exportFile, ExportType.SAVEFORWEB, exportOptions);
            activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }

        // If file is a folder
        if (file instanceof Folder) {
            processFolder(file);
        }
    }
}

// Start processing from the root folder
var rootFolder = Folder.selectDialog("Select a folder to process");
if (rootFolder != null) {
    processFolder(rootFolder);
}
