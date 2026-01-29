const fs = require('fs');
const path = require('path');

const loadFile = (request, response, filePath, filetype) => {
  const pathFile = path.resolve(__dirname, filePath);

  fs.stat(pathFile, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') response.writeHead(404, { 'Content-Type': 'text/plain' });
      else response.writeHead(500, { 'Content-Type': 'text/plain' });
      return response.end(err.message);
    }

    if (filetype === 'video/mp4') {
      let { range }= request.headers;
      if (!range) {
        range = 'bytes=0-';
      }
      
      const positions = range.replace(/bytes=/, '').split('-');

      let start = parseInt(positions[0], 10);
      const total = stats.size;
      let end = positions[1] ? parseInt(positions[1], 10) : total - 1;

      if (start > end) start = end;

      const chunksize = (end - start) + 1;

      response.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': filetype,
      });

      const stream = fs.createReadStream(pathFile, { start, end });

      stream.on('open', () => {
        stream.pipe(response);
      });

      stream.on('error', (streamErr) => {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end(streamErr);
      });

      
      return stream;
    }

    if (filetype === 'audio/mpeg') {
      response.writeHead(200, {
        'Content-Type': filetype,
        'Content-Length': stats.size,
      });

      const stream = fs.createReadStream(pathFile);

    stream.on('error', (e) => {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end(e.message);
     });

      stream.pipe(response);
      return stream;
    }

    response.writeHead(415, { 'Content-Type': 'text/plain' });
    return response.end(`Unsupported Content-Type: ${filetype}`);
  });
};

const getParty = (request, response) => {
    return loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
    return loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
}

const getBird = (request, response) => {
    return loadFile(request, response, '../client/bird.mp4', 'video/mp4');
}

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;