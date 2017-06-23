var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

var express = require('express');
var webapp = express();

/*
Set Cross-Origin Resource Sharing (CORS) headers so we don't have a problem
with Same Origin Policy when accessing our Cesium Web Service from other
applications.
*/
webapp.use(function(request, response, next) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var mainWindow = null;

/*
Define a listening endpoint for the Cesium Web Service. In this case, we simply
listen at the root URL '/'.  eg. http://localhost:8080/
If you need to add new parameters, update the script to include them.
The script calls getImg() in index.html, so make sure the parameters match.
Parameters are provided using a query string appended to the root URL.
The query string starts with a ?, then followed by key=value pairs separated by
ampersands (&).
eg. http://localhost:8080/?lat=32.71&lon=-117.16&alt=5000&hdg=1.4861&pit=-0.17453&rol=0.0
*/
webapp.get('/', function(request, response, next) {

	/*
	Ensure the required parameters have been provided and are valid.
	*/
	var latitude = ('lat' in request.query) ? parseFloat(request.query.lat) : NaN;
	var longitude = ('lon' in request.query) ? parseFloat(request.query.lon) : NaN;
	var altitude = ('lon' in request.query) ? parseFloat(request.query.alt) : NaN;
	
	if (isNaN(latitude) || isNaN(longitude) || isNaN(altitude)) {
		response.status(400);
		response.header('Content-Type', 'text/plain');
		response.send('Invalid request: Required parameters are missing or invalid.');
		return;
	}
	
	/*
	The following parameters are optional.  If omitted, they will be assigned a
	sane default value.
	*/
	var heading = ('lon' in request.query) ? parseFloat(request.query.hdg) : NaN;
	var pitch = ('lon' in request.query) ? parseFloat(request.query.pit) : NaN;
	var roll = ('lon' in request.query) ? parseFloat(request.query.rol) : NaN;
	
	if (isNaN(heading)) {
		heading = 0.0;
	}
	if (isNaN(pitch)) {
		pitch = -1.0;
	}
	if (isNaN(roll)) {
		roll = 0.0;
	}

	/*
	Create a string representing the script we want to run in index.html.
	We create an array containing each piece of the string and later join this
	array into a string. 	This method of string concatenation is more efficient
	than using the + string concatenation operator.
	The resulting string will look like: "getImg(32.71,-117.16,5000,1.4861,-0.17453,0.0);"
	*/
	var script = [];
	script.push("getImg(");
	script.push(latitude);
	script.push(",");
	script.push(longitude);
	script.push(",");
	script.push(altitude);
	script.push(",");
	script.push(heading);
	script.push(",");
	script.push(pitch);
	script.push(",");
	script.push(roll);
	script.push(");");

	/*
	Use Electron's executeJavaScript() function to call getImg() in index.html.
	This function returns a Promise which means the script being called is run
	asynchronously.  Our Promise will resolve once getImg() has completed.
	The result in the Promise is the image returned by getImg().
	*/
	mainWindow.webContents.executeJavaScript(script.join(''))
		.then((result) => {
			// Extract the base64 image data and convert it to an image buffer.
			var img = new Buffer(result.split(",")[1], 'base64');

			// Set HTTP Response Headers
			response.writeHead(200, {
				'Content-Type': 'image/png',
				'Content-Length': img.length
			});
			// Send the image as the response body
			response.end(img);
		})
		.catch((reason) => {
			response.status(500);
			response.header('Content-Type', 'text/plain');
			response.send('Server Error: ' + reason);
		});
});

app.on('ready', function() {

	mainWindow = new BrowserWindow({width: 900, height: 600});

	// Uncomment this to enable chrome debug tools in the Electron/Cesium browser window
	//mainWindow.webContents.openDevTools();

	mainWindow.loadURL('file://' + __dirname + '/index.html');

	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	app.on('window-all-closed', function() {
		if (process.platform != 'darwin') {
			app.quit();
		}
	});

	/*
	Once the Electron app is ready, start a web service listening on localhost
	on port 8080.
	This web service is usable by any process running on localhost. If you need
	to connect from a different computer, you'll need to change the	listening
	interface from localhost to 0.0.0.0.
	*/
	var server = webapp.listen(8080, 'localhost', function() {
		console.log("Cesium Web Service listening at http://localhost:8080/");
	});
});
