// Define the desired size that should be divisible by 4
var desiredSize = 4.0;

// Get all PNG files in folder and subfolders
var folder = Folder.selectDialog("Select a folder containing PNG files to modify");
var files = [];

// Recursive function to get all files in subfolders
function getFilesInSubfolders(folder) {
  var subFiles = folder.getFiles();
  for (var i = 0; i < subFiles.length; i++) {
    var subFile = subFiles[i];
    if (subFile instanceof Folder) {
      getFilesInSubfolders(subFile);
    } else if (subFile instanceof File && subFile.name.match(/\.png$/i)) {
      files.push(subFile);
    }
  }
}

// Call the function to get all files in subfolders
getFilesInSubfolders(folder);

// Loop through all PNG files
for (var i = 0; i < files.length; i++) {
  var file = files[i];

  // Open the file
  var doc = open(file);

  // Resize the image to 50% of its original size
  doc.resizeImage(doc.width * 0.5, doc.height * 0.5, null, ResampleMethod.BICUBICSHARPER);


  // Get the current width and height of the document
  var width = doc.width;
  var height = doc.height;

  // Get the new width and height of the document
  width = doc.width + 10;
  height = doc.height + 10;

  // Check if the width and height are divisible by the desired size
  var addToWidth = 0;
  var addToHeight = 0;
  if (width % desiredSize !== 0) {
    addToWidth = desiredSize - (width % desiredSize);
  }
  if (height % desiredSize !== 0) {
    addToHeight = desiredSize - (height % desiredSize);
  }

  // Calculate the new canvas size
  var newWidth = width + addToWidth;
  var newHeight = height + addToHeight;

  if ((newWidth % 4 !== 0) || (newHeight % 4 !== 0)) {
    newWidth = Math.ceil(newWidth / 4) * 4;
    newHeight = Math.ceil(newHeight / 4) * 4;
  }

  if ((newWidth % 4 !== 0) || (newHeight % 4 !== 0)) {
    newWidth = newWidth - 1;
    newHeight = newHeight - 1;
  }

  // Resize the canvas to the new size
  doc.resizeCanvas(newWidth, newHeight, AnchorPosition.MIDDLECENTER);

  // Center the image on the canvas
  doc.activeLayer.translate((newWidth - width) / 2, (newHeight - height) / 2);

  if ((newWidth % 4 !== 0) || (newHeight % 4 !== 0)) {
    var warning = newHeight + "/" + "4" + " = " + newHeight / 4 + "; " + newWidth + "/" + "4" + " = " + newWidth / 4 + "; " + doc.name + "; "
    alert(warning);
  }

  // Save the file as PNG without prompt
  var options = new ExportOptionsSaveForWeb();
  options.format = SaveDocumentType.PNG;
  options.PNG8 = false;
  options.transparency = true;
  options.interlaced = false;
  options.quality = 100;
  options.includeProfile = false;
  options.optimized = true;
  doc.save(options);

  // Close the document
  doc.close(SaveOptions.DONOTSAVECHANGES);
}
