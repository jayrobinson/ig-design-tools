﻿// Place Image(s) Into Layer(s) - Adobe Photoshop Script// Description: Randomly select image(s) from a specific directory, resize and// center within target layer(s). Support target layers of any size and shape,// and correctly scale image(s) to fill target layer(s).// ============================================================================// Installation:// 1. Place script in 'Adobe/Adobe Photoshop/Presets/Scripts/'// 2. Restart Photoshop// 3. Choose File > Scripts > Place Image(s) Into Layer(s)// ============================================================================// Provide the path to your images.var cat = prompt("What image folder do you want to use? (Subfolder1, Subfolder2, Subfolder3)", "Subfolder1", "Choose Category");var imgDir = "~/path/to/images/" + cat +"/";// Select image files from the folder.var folder = new Folder(imgDir),    files = folder.getFiles(/\.(jpg|tif|psd|bmp|gif|png)$/i);// Randomize the order of the images.files = shuffle(files);function shuffle(o){    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);    return o;};// Move new image file to the middle of the screenfunction moveLayerTo(fLayer, fX, fY) {    var position = fLayer.bounds;    position[0] = fX - position[0];    position[1] = fY - position[1];    fLayer.translate(-position[0],-position[1]);}// Create Smart Objects from selected layersfunction createSmartObject(layer) {   var doc = app.activeDocument;   doc.activeLayer = layer || doc.activeLayer;   try {      var idnewPlacedLayer = stringIDToTypeID("newPlacedLayer");      executeAction( idnewPlacedLayer, undefined, DialogModes.NO);      return doc.activeLayer;   } catch(e) {      return undefined;   }}function getSelectedLayersIdx() {    var selectedLayers = new Array;    var ref = new ActionReference();    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));    var desc = executeActionGet(ref);    if (desc.hasKey(stringIDToTypeID('targetLayers'))){        desc = desc.getList(stringIDToTypeID('targetLayers'));        var c = desc.count        var selectedLayers = new Array();        for (var i=0;i<c;i++){            try {                activeDocument.backgroundLayer;                selectedLayers.push(desc.getReference(i).getIndex());            } catch(e) {                selectedLayers.push(desc.getReference(i).getIndex()+1);            }        }    } else {        var ref = new ActionReference();        ref.putProperty( charIDToTypeID("Prpr"), charIDToTypeID("ItmI"));        ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));        try {            activeDocument.backgroundLayer;            selectedLayers.push(executeActionGet(ref).getInteger(charIDToTypeID("ItmI"))-1);        } catch(e) {            selectedLayers.push(executeActionGet(ref).getInteger(charIDToTypeID("ItmI")));        }    }    return selectedLayers;}function makeActiveByIndex(idx, visible){    for (var i = 0; i < idx.length; i++){        var desc = new ActionDescriptor();        var ref = new ActionReference();        ref.putIndex(charIDToTypeID("Lyr "), idx[i])        desc.putReference(charIDToTypeID("null"), ref);    if (i > 0) {        var idselectionModifier = stringIDToTypeID("selectionModifier");        var idselectionModifierType = stringIDToTypeID("selectionModifierType");        var idaddToSelection = stringIDToTypeID("addToSelection");        desc.putEnumerated(idselectionModifier, idselectionModifierType, idaddToSelection);    }        desc.putBoolean(charIDToTypeID("MkVs"), visible);        executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);    }}// Make an array of selected layersvar sl = getSelectedLayersIdx();var sLayers = new Array();for (var i = 0, l = sl.length; i < l; i++) {    makeActiveByIndex([sl[i]], false);    sLayers.push(activeDocument.activeLayer);}// Loop through each selected layer and assign an imagefor (var i = 0, l = sLayers.length; i < l; ++i) {    var activeLayer = sLayers[i];    var fileRef = File(files[i]);    var doc = open(fileRef);    // Place the image file into the target PSD    var newLayer = doc.activeLayer.duplicate(activeLayer, ElementPlacement.PLACEBEFORE);    doc.close(SaveOptions.DONOTSAVECHANGES);    // Rename the layer to match the file name    newLayer.name = files[i].name;    // Save as image as smart object to retain image quality    newLayer = createSmartObject(newLayer);    // Get the original width & height of the placed file    var oldWidth   = newLayer.bounds[2] - newLayer.bounds[0];    var oldHeight  = newLayer.bounds[3] - newLayer.bounds[1];    // Get the width & height of the target layer    var newWidth   = activeLayer.bounds[2] - activeLayer.bounds[0];    var newHeight  = activeLayer.bounds[3] - activeLayer.bounds[1];    // * Note: a handy guide to layer.bounds: https://forums.adobe.com/thread/1064028    //   good stuff starts at line #77    // Set scale for resizing based on height of target layer...    var scale = newHeight / oldHeight * 100;    // But if that doesn’t work, resize based on width.    if (oldWidth * scale / 100 < newWidth) {        scale = newWidth / oldWidth * 100;    }    // Resize the image proportionally to fill the target layer    // resize() takes x, y as percentages [0.00 - 1.00]    newLayer.resize(scale, scale);    // Move to the top x, y of the target layer    moveLayerTo(newLayer, activeLayer.bounds[0].value, activeLayer.bounds[1].value);    // Get resized width & height of the image    var resizedWidth  = newLayer.bounds[2] - newLayer.bounds[0];    var resizedHeight = newLayer.bounds[3] - newLayer.bounds[1];    // Adjust image to be centered on target layer    moveLayerTo(newLayer, (resizedWidth  - newWidth ) / 2 + activeLayer.bounds[0].value,                          (resizedHeight - newHeight) / 2 + activeLayer.bounds[1].value);    // Clip image to target layer    newLayer.grouped = true;    // Delete the originally targeted layer (optional)    //activeLayer.remove();}