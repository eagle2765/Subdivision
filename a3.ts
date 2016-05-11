///<reference path='./typings/tsd.d.ts'/>
///<reference path="./localTypings/webglutils.d.ts"/>

/*
 * Portions of this code are
 * Copyright 2015, Blair MacIntyre.
 * 
 * Portions of this code taken from http://webglfundamentals.org, at https://github.com/greggman/webgl-fundamentals
 * and are subject to the following license.  In particular, from 
 *    http://webglfundamentals.org/webgl/webgl-less-code-more-fun.html
 *    http://webglfundamentals.org/webgl/resources/primitives.js
 * 
 * Those portions Copyright 2014, Gregg Tavares.
 * All rights reserved.
 */

import loader = require('./loader');
//import textureUtils = require('./textureUtils');
import f3d = require('./f3d');

////////////////////////////////////////////////////////////////////////////////////////////
// stats module by mrdoob (https://github.com/mrdoob/stats.js) to show the performance 
// of your graphics
var stats = new Stats();
stats.setMode( 1 ); // 0: fps, 1: ms, 2: mb

stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild( stats.domElement );

////////////////////////////////////////////////////////////////////////////////////////////
// utilities
var rand = function(min: number, max?: number) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};

var randInt = function(range) {
  return Math.floor(Math.random() * range);
};

////////////////////////////////////////////////////////////////////////////////////////////
// get some of our canvas elements that we need
var canvas = <HTMLCanvasElement>document.getElementById("webgl");  
var filename = <HTMLInputElement>document.getElementById("filename");
var fileSelection = <HTMLSelectElement>document.getElementById("files");
var progressGuage = <HTMLProgressElement>document.getElementById("progress");
progressGuage.style.visibility = "hidden";

////////////////////////////////////////////////////////////////////////////////////////////
// our objects!

// when a new mesh comes in, we will process it on the next frame of the update.
// to tell the update we have a new mesh, set the newObject variable to it's data
var newObject = undefined;

// the current object being displayed
var object = undefined;

////////////////////////////////////////////////////////////////////////////////////////////
// stub's for  callbacks for the model downloader. They don't do much yet
//
// called when the mesh is successfully downloaded
var onLoad = function (mesh: loader.Mesh) {
  progressGuage.value = 100;
  progressGuage.style.visibility = "hidden";
	console.log("got a mesh: " + mesh);
  
  // the vertex array and the triangle array are different lengths.
  // we need to create new arrays that are not nested
  // - position: 3 entries per vertex (x, y, z)
  // - normals: 3 entries per vertex (x, y, z), the normal of the corresponding vertex 
  // - colors: 4 entries per vertex (r, g, b, a), in the range 0-255
  // - indices: 3 entries per triangle, each being an index into the vertex array. 
  var numVerts = mesh.v.length;
  var numTris = mesh.t.length;
  
  var nt = numTris;
  var nc = 3 * nt;

  // GOAL: you need to fill in these arrays with the data for the vertices! 
  var position = [];
  // i refers to the current vertex
  for (var i = 0; i < mesh.v.length; i++) {
    // vertex i's x, y, z
    position.push(mesh.v[i][0]);
    position.push(mesh.v[i][1]);
    position.push(mesh.v[i][2]);
  }
  
  // fill in random color for every vertex
  var color = [];
  // i refers to the current vertex
  for (var i = 0; i < mesh.v.length; i++) {
    color.push(randInt(255));
    color.push(randInt(255));
    color.push(randInt(255));
    // alpha always 255
    color.push(255);
  }

  
  // this is where you put the triangle vertex list
  var indices = [];
  // i refers to the triangle number
  for (var i = 0; i < mesh.t.length; i++) {
    // push the triangle's verticies (in counter-clockwise order)
    indices.push(mesh.t[i][0]);
    indices.push(mesh.t[i][1]);
    indices.push(mesh.t[i][2]);
  }
    
  
  
  
  // Triangle normals, want to be of size mesh.t.length * 3
  var trinormal = [];
  // initialize to 0
  for (var i = 0; i < mesh.t.length * 3; i++) {
      trinormal[i] = 0;
  }
  // i is triangle number
  // use triangle's verticies in indices to calculate triangle's normal
  // find the 2 vectors, then crossproduct for the normal
  for (var i = 0; i < mesh.t.length; i++) {
      
      // this triangle's first vertex, second vertex, and third vertex
      var v1 = indices[3*i];
      var v2 = indices[3*i + 1];
      var v3 = indices[3*i + 2];
      
      // vertex 1 of triangle i. Find x y and z of vertex 1
      var v1x = position[3 * v1]
      var v1y = position[3 * v1 + 1]
      var v1z = position[3 * v1 + 2]
      
      // vertex 2 of triangle i
      var v2x = position[3 * v2]
      var v2y = position[3 * v2 + 1]
      var v2z = position[3 * v2 + 2]
      
      // vertex 3 of triangle i
      var v3x = position[3 * v3]
      var v3y = position[3 * v3 + 1]
      var v3z = position[3 * v3 + 2]
      
      // vector x y z from vertex 1 to vertex 2
      var vec12x = v2x - v1x;
      var vec12y = v2y - v1y;
      var vec12z = v2z - v1z;
      
      // vector x y z from vertex 1 to vertex 3
      var vec13x = v3x - v1x;
      var vec13y = v3y - v1y;
      var vec13z = v3z - v1z;
      
      // do cross product
      var crossx = vec12y * vec13z - vec12z * vec13y;
      var crossy = vec12z * vec13x - vec12x * vec13z;
      var crossz = vec12x * vec13y - vec12y * vec13x;
      
      // fill in normal vector x y z for triangle i
      trinormal[3 * i] = crossx;
      trinormal[3 * i + 1] = crossy;
      trinormal[3 * i + 2] = crossz;
  }
  // fill in the vertex normals. Want to be of size mesh.v.length*3
  var normal = [];
  // initialize to 0
  for (var i = 0; i < mesh.v.length * 3; i++) {
      normal[i] = 0;
  }
  // for every vertex, use indices to find triangles with that vertex and add up the triangles' normals. Then normalize
  // i refers to a vertex number
  // fill in vertex normals
  for (var i = 0; i < nc; i++) {
      normal[3 * indices[i]] += trinormal[3 * Math.floor(i/3)];
      normal[3 * indices[i] + 1] += trinormal[3 * Math.floor(i/3) + 1];
      normal[3 * indices[i] + 2] += trinormal[3 * Math.floor(i/3) + 2];
  }
  

  

  
  //////////////
  ///////// YOUR CODE HERE TO TAKE THE MESH OBJECT AND CREATE ALL THE INFORMATION NEEDED TO RENDER
  //////////////
  
  // bb1 and bb2 are the corners of the bounding box of the object.  
  // min x y z
  var bb1 = vec3.create();
  // max x y z
  var bb2 = vec3.create();

  var minx, miny, minz, maxx, maxy, maxz;
  minx = position[0];
  maxx = position[0];
  miny = position[1];
  maxy = position[1];
  minz = position[2];
  maxz = position[2];
  
  // iterate through all verticies
  for (var i = 0; i < mesh.v.length; i++) {
      // min x
      if (position[3 * i] < minx) {
          minx = position[3 * i];
      }
      // min y
      if (position[3 * i + 1] < miny) {
          miny = position[3 * i + 1];
      }
      // min z
      if (position[3 * i + 2] < minz) {
          minz = position[3 * i + 2];
      }
      
      // max x
      if (position[3 * i] > maxx) {
          maxx = position[3 * i];
      }
      // max y
      if (position[3 * i + 1] > maxy) {
          maxy = position[3 * i + 1];
      }
      // max z
      if (position[3 * i + 2] > maxz) {
          maxz = position[3 * i + 2];
      }
  }
  bb1 = vec3.fromValues(minx, miny, minz);
  bb2 = vec3.fromValues(maxx, maxy, maxz);
  var centerx, centery, centerz;
  centerx = (minx + maxx) / 2;
  centery = (miny + maxy) / 2;
  centerz = (minz + maxz) / 2;
    
  
  // Setup the new object.  you can add more data to this object if you like
  // to help with subdivision (for example)
  newObject = {
    boundingBox: [bb1, bb2],
    scaleFactor: 300/vec3.distance(bb1,bb2),  // FIX!  the scale should be such that the largest view of the object is 300 units
    center: [centerx, centery, centerz],  // FIX!  the center of the object
    numElements: indices.length,
    nt: nt,
    arrays: {
      position: new Float32Array(position),
      normal: new Float32Array(normal),
      color: new Uint8Array(color),
      indices: new Uint16Array(indices)
    }
  };
}

// called periodically during download.  Some servers set the file size so 
// progres.lengthComputable is true, which lets us compute the progress
var onProgress = function (progress: ProgressEvent) {
  if (progress.lengthComputable) {
    progressGuage.value = progress.loaded / progress.total * 100;
  }
	console.log("loading: " + progress.loaded + " of " + progress.total +  "...");
}

// of there's an error, this will be called.  We'll log it to the console
var onError = function (error: ErrorEvent) {
	console.log("error! " + error);
}

// HTML dom element callback functions.  Putting them on the window object makes 
// them visible to the DOM elements
window["jsonFileChanged"] = () => {
   // we stored the filename in the select option items value property 
   filename.value = fileSelection.value;
}

window["loadModel"] = () => {
    // reset and show the progress bar
    progressGuage.max = 100;
    progressGuage.value = 0;
    progressGuage.style.visibility = "visible";
    
    // attempt to download the modele
    loader.loadMesh("models/" + filename.value, onLoad, onProgress, onError);
}
 
window["onSubdivide"] = () => {
    console.log("Subdivide called!  You should do the subdivision!");
    
  //////////////
  ///////// YOUR CODE HERE TO TAKE THE CURRENT OBJECT and SUBDIVIDE it, creating a newObject
  //////////////
  // Setup the new object.  you can add more data to this object if you like
  // to help with subdivision (for example)
  
  var bb1 = object.boundingBox[0];
  var bb2 = object.boundingBox[1];
  
  var position = [];
  for (var i = 0; i < object.arrays.position.length; i++) {
      position[i] = object.arrays.position[i];
  }
  
  var centerx = object.center[0];
  var centery = object.center[1];
  var centerz = object.center[2];
  
  var indices = [];
  for (var i = 0; i < object.arrays.indices.length; i++) {
      indices[i] = object.arrays.indices[i];
  }
  
  var normal = [];
  
  var color = [];

  // number of verticies
  var nv = position.length / 3;
  var nt = object.nt;
  var nc = nt * 3;
  // where you add the new verticies indexed by corner
  var W = [];
  
  
  // Helper Functions
  // the triangle this corner belongs to
  function t(c: number): number {
      return Math.floor(c/3);
  }
  
  // takes in corner number (index into indices) returns next corner as index into indices table
  function n(c: number): number {
      return 3*t(c) + (c+1)%3;
  }
  
  function p(c: number): number {
      return n(n(c));
  }
  
  // takes in corner and returns corresponding vertex number
  function v(c: number): number {
      return indices[c];
  }
  
  // takes in corner and returns corner opposite
  function o(c: number): number {
      if (opposite[c] != -1) {
          return opposite[c];
      }
      return c;
  }
  
  // takes in corner and returns the vertex created by it
  function w(c: number): number {
      return W[c];
  }
  
  function b(c: number): boolean {
      if (opposite[c] == -1 || opposite[c] == c) {
          return true;
      }
      return false;
  }
  
  function l(c: number): number {
      return o(n(c));
  }
  
  function r(c: number): number {
      return o(p(c));
  }
  
  function s(c: number): number {
      return n(l(c));
  }
  
  function gx(c: number): number{
      return position[3 * v(c)];
  }
  
  function gy(c: number): number {
      return position[3 * v(c) + 1];
  }
  
  function gz(c: number): number {
      return position[3 * v(c) + 2];
  }
  
  // slow O table
  // want to be of indices.length
  var opposite = [];
  // initialize to -1
  for (var i = 0; i < indices.length; i++) {
    opposite[i] = -1;
  }
  // cancerously slow. Go through the entire triangle vertex list
  // each corner
  for (var i = 0; i < indices.length; i++) {
    // each other corner
    for (var j = i + 1; j < indices.length; j++) {
        // opposite corner logic
            if ((v(n(i)) == v(p(j))) && (v(p(i)) == v(n(j)))) {
            opposite[i] = j;
            opposite[j] = i;
        }
    }
  }
  

  // split edges
  // i is the corner number
  for (var i = 0; i < nc; i++) {
      // if the corner doesn't have an opposite
      if (b(i)) {
          // add new vertex's position to the position table
          // average x
          position[nv * 3] = (position[v(n(i))* 3] + position[v(p(i)) * 3]) / 2;
          // average y
          position[nv * 3 + 1] = (position[v(n(i))*3 + 1] + position[v(p(i))*3 + 1]) / 2;
          // average z
          position[nv * 3 + 2] = (position[v(n(i))*3 + 2] + position[v(p(i))*3 + 2]) / 2;
          // add vertex to new vertex table
          W[i] = nv;
          // increase vertex number count
          nv = nv + 1;
      // if corner has an opposite
      } else {
          // prevents adding the same new verticies multiple times
          if (i < o(i)) {
                // add new vertex's position to the position table
                // average x
                position[nv * 3] = (position[v(n(i)) * 3] + position[v(p(i)) * 3]) / 2;
                // average y
                position[nv * 3 + 1] = (position[v(n(i)) * 3 + 1] + position[v(p(i)) * 3 + 1]) / 2;
                // average z
                position[nv * 3 + 2] = (position[v(n(i)) * 3 + 2] + position[v(p(i)) * 3 + 2]) / 2;
                // here we add the new vertex number to both the corner and its opposite in W where the corner # is the index into W
                W[o(i)] = nv;
                W[i] = nv;
                nv = nv + 1;
          }
      }
  }
  
  
  // bulge
  // G[W[i]].addScaledVec(0.25, midPt(    midPt(   g(l(i)), g(r(i))    ), midPt(  g(l(o(i))), g(r(o(i)))  )       ).    vecTo(    midPt(g(i), g(o(i))     )))
  //                                               tmx                               smx                                                     firstmx
  //                               /........................................tsmx  tsmy tsmz............/       
  //                                /...................................................firstmx firstmy firstmz - tsmx tsmy tsmz........................../
                                       
  for (var i = 0; i < indices.length; i++) {
      if ( (!b(i)) && (i<o(i)) ) {
          if ( !b(p(i)) && !b(n(i)) && !b(p(o(i))) && !b(n(o(i))) ) {
              var firstmx = (gx(i) + gx(o(i))) / 2;
              var firstmy = (gy(i) + gy(o(i))) / 2;
              var firstmz = (gz(i) + gz(o(i))) / 2;
              
              var secondmx = (gx(l(o(i))) + gx(r(o(i)))) / 2;   
              var secondmy = (gy(l(o(i))) + gy(r(o(i)))) / 2;
              var secondmz = (gz(l(o(i))) + gz(r(o(i)))) / 2;
              
              var thirdmx = (gx(l(i)) + gx(r(i))) / 2;
              var thirdmy = (gy(l(i)) + gy(r(i))) / 2;
              var thirdmz = (gz(l(i)) + gz(r(i))) / 2;
              
              var fourthmx = (secondmx + thirdmx) / 2
              var fourthmy = (secondmy + thirdmy) / 2
              var fourthmz = (secondmz + thirdmz) / 2
              
              var subx = firstmx - fourthmx;
              var suby = firstmy - fourthmy;
              var subz = firstmz - fourthmz;
              
              var scaledx = subx * 0.25;
              var scaledy = suby * 0.25;
              var scaledz = subz * 0.25;
              
              position[3 * W[i]] += scaledx;
              position[3 * W[i] + 1] += scaledy;
              position[3 * W[i] + 2] += scaledz;
              
          }
      }
  }
/*

  for (var i = 0; i < indices.length; i++) {
      if ( (!b(i)) && (i<o(i)) ) {
          if ( !b(p(i)) && !b(n(i)) && !b(p(o(i))) && !b(n(o(i))) ) {
              var thisx = position[3 * W[i]]; 
              var thisy = position[3 * W[i] + 1];
              var thisz = position[3 * W[i] + 2];
              
              
              var firstmx = (position[3 * v(i)] + position[3 * v(o(i))]) / 2;
              var firstmy = (position[3 * v(i) + 1] + position[3 * v(o(i)) + 1]) / 2;
              var firstmz = (position[3 * v(i) + 2] + position[3 * v(o(i)) + 2]) / 2;
              
              var smx = (position[3 * v(l(o(i)))] + position[3 * v(r(o(i)))]) / 2;
              var smy = (position[3 * v(l(o(i))) + 1] + position[3 * v(r(o(i))) + 1]) / 2;
              var smz = (position[3 * v(l(o(i))) + 2] + position[3 * v(r(o(i))) + 2]) / 2;
              
              var tmx = (position[3 * v(l(i))] + position[3 * v(r(i))]) / 2;
              var tmy = (position[3 * v(l(i)) + 1] + position[3 * v(r(i))] + 1) / 2;
              var tmz = (position[3 * v(l(i)) + 2] + position[3 * v(r(i))] + 2) / 2;
              
              var tsmx = (smx + tmx) / 2;
              var tsmy = (smy + tmy) / 2;
              var tsmz = (smz + tmz) / 2;
              
              var subx = firstmx - tsmx;
              var suby = firstmy - tsmy;
              var subz = firstmz - tsmz;
              
              var scaledx = subx * 0.25;
              var scaledy = suby * 0.25;
              var scaledz = subz * 0.25;
              
              position[3 * W[i]] = thisx + scaledx;
              position[3 * W[i] + 1] = thisy + scaledy;
              position[3 * W[i] + 2] = thisz + scaledz;
              
          }
      }
  }
  
*/  

 
  
  
  // new vertex table (indices v 2)
  var V = [];
  for (var i = 0; i < nt * 4 * 3; i++) {
      V[i] = -1;
  }
  
  
  // split triangles into 4
  for (var i = 0; i < 3 * nt; i = i + 3) {
      // triangle 1
      V[3*nt + i] = v(i);
      V[n(3*nt + i)] = w(p(i));
      V[p(3*nt + i)] = w(n(i));
      
      // triangle 2
      V[6*nt + i] = v(n(i));
      V[n(6*nt + i)] = w(i);
      V[p(6*nt + i)] = w(p(i));
      
      // triangle 3
      V[9*nt + i] = v(p(i));
      V[n(9*nt +i)] = w(n(i));
      V[p(9*nt +i)] = w(i);
      
      // triangle 4
      V[i] = w(i);
      V[n(i)] = w(n(i));
      V[p(i)] = w(p(i));
  }
  nt = 4 * nt;
  nc = 3 * nt;
  
  for (var i = 0; i < V.length; i++) {
      indices[i] = V[i];
  }
 
  
  // Triangle normals, want to be of size nt * 3
  var trinormal = [];
  // initialize to 0
  for (var i = 0; i < nt * 3; i++) {
      trinormal.push(0);
  }
  // i is triangle number
  // use triangle's verticies in V to calculate triangle's normal
  // find the 2 vectors, then crossproduct for the normal
  for (var i = 0; i < nt; i++) {
      
      // this triangle's first vertex, second vertex, and third vertex
      var v1 = V[3*i];
      var v2 = V[n(3*i)];
      var v3 = V[p(3*i)];
      
      // vertex 1 of triangle i. Find x y and z of vertex 1
      var v1x = position[3 * v1]
      var v1y = position[3 * v1 + 1]
      var v1z = position[3 * v1 + 2]
      
      // vertex 2 of triangle i
      var v2x = position[3 * v2]
      var v2y = position[3 * v2 + 1]
      var v2z = position[3 * v2 + 2]
      
      // vertex 3 of triangle i
      var v3x = position[3 * v3]
      var v3y = position[3 * v3 + 1]
      var v3z = position[3 * v3 + 2]
      
      // vector x y z from vertex 1 to vertex 2
      var vec12x = v2x - v1x;
      var vec12y = v2y - v1y;
      var vec12z = v2z - v1z;
      
      // vector x y z from vertex 1 to vertex 3
      var vec13x = v3x - v1x;
      var vec13y = v3y - v1y;
      var vec13z = v3z - v1z;
      
      // do cross product
      var crossx = vec12y * vec13z - vec12z * vec13y;
      var crossy = vec12z * vec13x - vec12x * vec13z;
      var crossz = vec12x * vec13y - vec12y * vec13x;
      
      // fill in normal vector x y z for triangle i
      trinormal[3 * i] = crossx;
      trinormal[3 * i + 1] = crossy;
      trinormal[3 * i + 2] = crossz;
  }
  // fill in the vertex normals. Want to be of size of verticies * 3
  var normal = [];
  // initialize to 0
  for (var i = 0; i < nv * 3; i++) {
      normal[i] = 0;
  }
  
  // fill in vertex normals
  for (var i = 0; i < nc; i++) {
      normal[3 * v(i)] += trinormal[3 * t(i)];
      normal[3 * v(i) + 1] += trinormal[3 * t(i) + 1];
      normal[3 * v(i) + 2] += trinormal[3 * t(i) + 2];
  }
  
  // make unit
    for (var i = 0; i < nv; i++) {
      var x = normal[3 * i];
      var y = normal[3 * i + 1];
      var z = normal[3 * i + 2];
      var length = Math.sqrt(x * x + y * y + z * z);
      normal[3 * i] /= length;
      normal[3 * i + 1] /= length;
      normal[3 * i + 2] /= length;
  }
  
  
  
  
  // i refers to the current vertex
  for (var i = 0; i < nv; i++) {
    color.push(randInt(255));
    color.push(randInt(255));
    color.push(randInt(255));
    // alpha always 255
    color.push(255);
  }

  
  newObject = {
    boundingBox: [bb1, bb2],
    scaleFactor: 300/vec3.distance(bb1,bb2),  // FIX!  the scale should be such that the largest view of the object is 300 units
    center: [centerx, centery, centerz],  // FIX!  the center of the object
    numElements: indices.length,
    nt: nt,
    arrays: {
      position: new Float32Array(position),
      normal: new Float32Array(normal),
      color: new Uint8Array(color),
      indices: new Uint16Array(indices)
    }
  };
  
} 

////////////////////////////////////////////////////////////////////////////////////////////
// some simple interaction using the mouse.
// we are going to get small motion offsets of the mouse, and use these to rotate the object
//
// our offset() function from assignment 0, to give us a good mouse position in the canvas 
function offset(e: MouseEvent): GLM.IArray {
    e = e || <MouseEvent> window.event;

    var target = <Element> e.target || e.srcElement,
        rect = target.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

    return vec2.fromValues(offsetX, offsetY);
}

var mouseStart = undefined;  // previous mouse position
var mouseDelta = undefined;  // the amount the mouse has moved
var mouseAngles = vec2.create();  // angle offset corresponding to mouse movement

// start things off with a down press
canvas.onmousedown = (ev: MouseEvent) => {
    mouseStart = offset(ev);        
    mouseDelta = vec2.create();  // initialize to 0,0
    vec2.set(mouseAngles, 0, 0);
}

// stop things with a mouse release
canvas.onmouseup = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
        const clickEnd = offset(ev);
        vec2.sub(mouseDelta, clickEnd, mouseStart);        // delta = end - start
        vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);  

        // now toss the two values since the mouse is up
        mouseDelta = undefined;
        mouseStart = undefined; 
    }
}

// if we're moving and the mouse is down        
canvas.onmousemove = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      const m = offset(ev);
      vec2.sub(mouseDelta, m, mouseStart);    // delta = mouse - start 
      vec2.copy(mouseStart, m);               // start becomes current position
      vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);

      // console.log("mousemove mouseAngles: " + mouseAngles[0] + ", " + mouseAngles[1]);
      // console.log("mousemove mouseDelta: " + mouseDelta[0] + ", " + mouseDelta[1]);
      // console.log("mousemove mouseStart: " + mouseStart[0] + ", " + mouseStart[1]);
   }
}

// stop things if you move out of the window
canvas.onmouseout = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      vec2.set(mouseAngles, 0, 0);
      mouseDelta = undefined;
      mouseStart = undefined;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////
// start things off by calling initWebGL
initWebGL();

function initWebGL() {
  // get the rendering context for webGL
  var gl: WebGLRenderingContext = getWebGLContext(canvas);
  if (!gl) {
    return;  // no webgl!  Bye bye
  }

  // turn on backface culling and zbuffering
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // attempt to download and set up our GLSL shaders.  When they download, processed to the next step
  // of our program, the "main" routing
  loader.loadFiles(['shaders/a3-shader.vert', 'shaders/a3-shader.frag'], function (shaderText) {
    var program = createProgramFromSources(gl, shaderText);
    main(gl, program);
  }, function (url) {
      alert('Shader failed to download "' + url + '"');
  }); 
}

////////////////////////////////////////////////////////////////////////////////////////////
// webGL is set up, and our Shader program has been created.  Finish setting up our webGL application       
function main(gl: WebGLRenderingContext, program: WebGLProgram) {
  
  // use the webgl-utils library to create setters for all the uniforms and attributes in our shaders.
  // It enumerates all of the uniforms and attributes in the program, and creates utility functions to 
  // allow "setUniforms" and "setAttributes" (below) to set the shader variables from a javascript object. 
  // The objects have a key for each uniform or attribute, and a value containing the parameters for the
  // setter function
  var uniformSetters = createUniformSetters(gl, program);
  var attribSetters  = createAttributeSetters(gl, program);

  /// ***************
  /// This code creates the initial 3D "F".  You can look here for guidance on what some of the elements
  /// of the "object" are, and may want to use the debugger to look at the content of the fields of the "arrays" 
  /// object returned from f3d.createArrays(gl) 
  var arrays = f3d.createArrays(gl);
  var bb1 = vec3.fromValues(100, 150, 30);
  var bb2 = vec3.fromValues(0, 0, 0);
  object = {
    boundingBox: [bb2,bb1],
    scaleFactor: 300/vec3.distance(bb1,bb2), 
    center: [50, 75, 15],
    numElements: arrays.indices.length,
    arrays: arrays 
  }
  
  var buffers = {
    position: gl.createBuffer(),
    //texcoord: gl.createBuffer(),
    normal: gl.createBuffer(),
    color: gl.createBuffer(),
    indices: gl.createBuffer()
  };
  object.buffers = buffers;
      
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);
  //gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
  //gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.bufferData(gl.ARRAY_BUFFER, arrays.color, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);
  
  var attribs = {
    a_position: { buffer: buffers.position, numComponents: 3, },
    a_normal:   { buffer: buffers.normal,   numComponents: 3, },
    //a_texcoord: { buffer: buffers.texcoord, numComponents: 2, },
    a_color:    { buffer: buffers.color,    numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true  }
  };

  /// you will need to set up your arrays and then create your buffers
  /// ********************
  
  
  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(60);
  var cameraHeight = 50;

  var uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos:         [50, 30, -100],
    u_viewInverse:           mat4.create(),
    u_lightColor:            [1, 1, 1, 1],
    u_ambient:               [0.1, 0.1, 0.1, 0.1]
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection:   mat4.create(),
    u_world:                 mat4.create(),
    u_worldInverseTranspose: mat4.create(),
  };

  // var textures = [
  //   textureUtils.makeStripeTexture(gl, { color1: "#FFF", color2: "#CCC", }),
  //   textureUtils.makeCheckerTexture(gl, { color1: "#FFF", color2: "#CCC", }),
  //   textureUtils.makeCircleTexture(gl, { color1: "#FFF", color2: "#CCC", }),
  // ];

  var baseColor = rand(240);
  var objectState = { 
      materialUniforms: {
        u_colorMult:             chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        //u_diffuse:               textures[randInt(textures.length)],
        u_specular:              [1, 1, 1, 1],
        u_shininess:             450,
        u_specularFactor:        0.75,
      }
  };

  // some variables we'll reuse below
  var projectionMatrix = mat4.create();
  var viewMatrix = mat4.create();
  var rotationMatrix = mat4.create();
  var matrix = mat4.create();  // a scratch matrix
  var invMatrix = mat4.create();
  var axisVector = vec3.create();
  
  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time: number) {
    time *= 0.001; 

    // reset the object if a new one has been loaded
    if (newObject) {
      object = newObject;
      newObject = undefined;
      
      arrays = object.arrays;
      buffers = {
        position: gl.createBuffer(),
        //texcoord: gl.createBuffer(),
        normal: gl.createBuffer(),
        color: gl.createBuffer(),
        indices: gl.createBuffer()
      };
      object.buffers = buffers;
      
      // For each of the new buffers, load the array data into it. 
      // first, bindBuffer sets it as the "current Buffer" and then "bufferData"
      // loads the data into it.  Each array (vertex, color, normal, texture coordinates)
      // has the same number of entries, and is used together by the shaders when it's
      // index is referenced by the index array for the triangle list
      
      // vertex positions
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);

      // texture coordinates
      //gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
      //gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);

      // vertex normals
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);

      // vertex colors
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
      gl.bufferData(gl.ARRAY_BUFFER, arrays.color, gl.STATIC_DRAW);

      // triangle indices.  
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);

      // the attribute data to be used by the "setAttributes" utility function
      attribs = {
        a_position: { buffer: buffers.position, numComponents: 3, },
        a_normal:   { buffer: buffers.normal,   numComponents: 3, },
        //a_texcoord: { buffer: buffers.texcoord, numComponents: 2, },
        a_color:    { buffer: buffers.color,    numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true  }
      }; 
      
      // reset the rotation matrix
      //rotationMatrix = mat4.identity(rotationMatrix);     
    }    
   
    // measure time taken for the little stats meter
    stats.begin();

    // if the window changed size, reset the WebGL canvas size to match.  The displayed size of the canvas
    // (determined by window size, layout, and your CSS) is separate from the size of the WebGL render buffers, 
    // which you can control by setting canvas.width and canvas.height
    resizeCanvasToDisplaySize(canvas);

    // Set the viewport to match the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = canvas.clientWidth / canvas.clientHeight;
    mat4.perspective(projectionMatrix,fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, -200];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = mat4.lookAt(uniformsThatAreTheSameForAllObjects.u_viewInverse, cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    mat4.invert(viewMatrix, cameraMatrix);
    
    // tell WebGL to use our shader program.  probably don't need to do this each time, since we aren't
    // changing it, but it doesn't hurt in this simple example.
    gl.useProgram(program);
    
    // Setup all the needed attributes.   This utility function does the following for each attribute, 
    // where "index" is the index of the shader attribute found by "createAttributeSetters" above, and
    // "b" is the value of the entry in the "attribs" array cooresponding to the shader attribute name:
    //   gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
    //   gl.enableVertexAttribArray(index);
    //   gl.vertexAttribPointer(
    //     index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);    
    setAttributes(attribSetters, attribs);

    // Bind the indices for use in the index-based drawElements below
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set the uniforms that are the same for all objects.  Unlike the attributes, each uniform setter
    // is different, depending on the type of the uniform variable.  Look in webgl-util.js for the
    // implementation of  setUniforms to see the details for specific types       
    setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);
   
    ///////////////////////////////////////////////////////
    // Compute the view matrix and corresponding other matrices for rendering.
    
    // first make a copy of our rotationMatrix
    mat4.copy(matrix, rotationMatrix);
    
    // adjust the rotation based on mouse activity.  mouseAngles is set if user is dragging 
    if (mouseAngles[0] !== 0 || mouseAngles[1] !== 0) {
      // need an inverse world transform so we can find out what the world X axis for our first rotation is
      mat4.invert(invMatrix, matrix);
      // get the world X axis
      var xAxis = vec3.transformMat4(axisVector, vec3.fromValues(1,0,0), invMatrix);

      // rotate about the world X axis (the X parallel to the screen!)
      mat4.rotate(matrix, matrix, -mouseAngles[1], xAxis);
      
      // now get the inverse world transform so we can find the world Y axis
      mat4.invert(invMatrix, matrix);
      // get the world Y axis
      var yAxis = vec3.transformMat4(axisVector, vec3.fromValues(0,1,0), invMatrix);

      // rotate about teh world Y axis
      mat4.rotate(matrix, matrix, mouseAngles[0], yAxis);
  
      // save the resulting matrix back to the cumulative rotation matrix 
      mat4.copy(rotationMatrix, matrix);
      vec2.set(mouseAngles, 0, 0);        
    }   

    // add a translate and scale to the object World xform, so we have:  R * T * S
    mat4.translate(matrix, rotationMatrix, [-object.center[0]*object.scaleFactor, -object.center[1]*object.scaleFactor, 
                                            -object.center[2]*object.scaleFactor]);
    mat4.scale(matrix, matrix, [object.scaleFactor, object.scaleFactor, object.scaleFactor]);
    mat4.copy(uniformsThatAreComputedForEachObject.u_world, matrix);
    
    // get proj * view * world
    mat4.multiply(matrix, viewMatrix, uniformsThatAreComputedForEachObject.u_world);
    mat4.multiply(uniformsThatAreComputedForEachObject.u_worldViewProjection, projectionMatrix, matrix);

    // get worldInvTranspose.  For an explaination of why we need this, for fixing the normals, see
    // http://www.unknownroad.com/rtfm/graphics/rt_normals.html
    mat4.transpose(uniformsThatAreComputedForEachObject.u_worldInverseTranspose, 
                   mat4.invert(matrix, uniformsThatAreComputedForEachObject.u_world));

    // Set the uniforms we just computed
    setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);

    // Set the uniforms that are specific to the this object.
    setUniforms(uniformSetters, objectState.materialUniforms);

    // Draw the geometry.   Everything is keyed to the ""
    gl.drawElements(gl.TRIANGLES, object.numElements, gl.UNSIGNED_SHORT, 0);

    // stats meter
    stats.end();

    requestAnimationFrame(drawScene);
  }
}

