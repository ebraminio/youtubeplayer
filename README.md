# Youtube Player #
```bash
git clone https://bitbucket.org/ebraminio/youtubeplayer
cd youtubeplayer
wget https://iojs.org/dist/v1.2.0/iojs-v1.2.0-linux-x64.tar.xz
tar xf iojs-v1.2.0-linux-x64.tar.xz
rm iojs-v1.2.0-linux-x64.tar.xz
mv iojs-v1.2.0-linux-x64 iojs
iojs/bin/npm install
iojs/bin/iojs server.js
```
Run `iojs/bin/iojs server.js PORT` to use with an alternative PORT.

Usage:
`http://HOST:19876/https://www.youtube.com/watch?v=hIUcGhUGFvg`, `http://HOST:19876/watch?v=hIUcGhUGFvg` or `http://HOST:19876/watch?v=hIUcGhUGFvg` works equally.

`http://HOST:19876/hIUcGhUGFvg.webm?list` lists downloadable formats and `http://HOST:19876/hIUcGhUGFvg.webm?list` prints the given YouTube video info.