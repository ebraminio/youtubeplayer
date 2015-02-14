'use strict';

var url = require('url');
var querystring = require('querystring');
var ytdl = require('ytdl-core');

function readRangeHeader(range, totalLength) {
  if (!range) { return; }
  var positions = range.replace('bytes=', '').split('-');

  var start = parseInt(positions[0], 10);
  var end = parseInt(positions[1], 10);

  var result = {
    start: isNaN(start) ? 0 : start,
    end: isNaN(end) ? (totalLength - 1) : end
  };

  if (!isNaN(start) && isNaN(end)) {
    result.start = start;
    result.end = totalLength - 1;
  }

  if (isNaN(start) && !isNaN(end)) {
    result.start = totalLength - end;
    result.end = totalLength - 1;
  }

  return result;
}

var videoSizes = {};

function server(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(501);
    res.end();
    return;
  }
  var videoId = querystring.parse(url.parse(req.url).query).v;
  if (videoId) {
    ytdl.getInfo('http://youtu.be/' + videoId, {}, function (err, info) {
      if (err) {
        res.writeHead(404);
        res.end('Seems the link you\'ve given is broken..');
        return;
      }
      res.writeHead(302, { 'Location': '/pr/' + info.title.replace(/ /g, '_') + ' ' + videoId + '.webm' });
      res.end();
    });
    return;
  }

  videoId = (/([a-zA-Z0-9_-]{11})\.webm$/.exec(req.url) || {})[1];
  if (!videoId) {
    res.writeHead(404);
    res.end('Sorry, nothing really interesting is here');
    return;
  }

  var options = {
    quality: 43, //'lowest',
    filter: function(format) { return format.container === 'webm'; }
  };
  ytdl.getInfo('http://www.youtube.com/watch?v=' + videoId, options, function (err, info) {
    if (err) {
      res.writeHead(404);
      res.end('Seems the link you\'ve given is broken.');
      return;
    }
    var sizePromise;
    if (!videoSizes[videoId]) {
      sizePromise = new Promise(function (resolve, reject) {
        ytdl.downloadFromInfo(info, options).on('format', function (format) {
          if (format instanceof Error) {
            reject(error);
          } else {
            videoSizes[videoId] = format.size;
            resolve(format.size);
          }
        }).on('error', function () { reject('Not downloadable'); });
      });
    } else {
      sizePromise = Promise.resolve(videoSizes[videoId]);
    }

    sizePromise.then(function (size) {
      var range = readRangeHeader(req.headers.range, size);

      if (range) {
        // If the range can't be fulfilled.
        if (range.start >= size || range.end >= size) {
          // 416: 'Requested Range Not Satisfiable'
          res.writeHead(416, {
            'Content-Range': 'bytes */' + stat.size
          });
          res.end('Requested Range Not Satisfiable');
          return;
        }

        options.range = range.start + '-' + range.end;
      }

      ytdl.downloadFromInfo(info, options).on('format', function (format) {
        if (format instanceof Error) {
          res.writeHead(403);
        } else if (!range) {
          res.writeHead(200, {
            'Content-Length': format.size,
            'Content-Type': 'video/webm',
            'Accept-Ranges': 'bytes'
          });
        } else {
          res.writeHead(206, {
            'Content-Range': 'bytes ' + range.start + '-' + range.end + '/' + size,
            'Content-Length': range.start === range.end ? 0 : (range.end - range.start + 1),
            'Content-Type': 'video/webm',
            'Accept-Ranges': 'bytes'
          });
        }
      }).on('error', function (e) {
        res.end((e || '').toString());
      }).pipe(res);
    }).then(undefined, function (error) {
      res.writeHead(404);
      res.end('Internal error ' + error);
    });
  });
}

if (process.env.FCGI_MODE) { // called through fcgi
  require('node-fastcgi').createServer(server).listen();
} else { // called directly, development
  var port = process.argv[2] || 19876;
  require('http').createServer(server).listen(port, '0.0.0.0');
  console.log('Server running at http://0.0.0.0:' + port + '/');
}

