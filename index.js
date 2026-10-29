const express = require('express');
const YTMusic = require('ytmusic-api');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const ytmusic = new YTMusic();

const PORT = process.env.PORT || 3000;

const COOKIE_FILE = path.join(__dirname, 'cookies.txt');
const HAS_COOKIES = fs.existsSync(COOKIE_FILE);

app.use(express.static(path.join(__dirname, 'frontend')));

if (HAS_COOKIES) {
  console.log('[SERVER] Using cookies.txt');
} else {
  console.log('[SERVER] No cookies.txt found');
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('error', reject);

    proc.on('close', code => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(
          new Error(
            stderr || `yt-dlp exited with code ${code}`
          )
        );
      }
    });
  });
}

function getYtDlpArgs(url, extraArgs) {
  const args = [];

  if (HAS_COOKIES) {
    args.push('--cookies', COOKIE_FILE);
  }

  if (extraArgs && extraArgs.length) {
    args.push.apply(args, extraArgs);
  }

  args.push('--no-playlist', url);

  return args;
}

async function getDirectAudioUrl(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const args = getYtDlpArgs(url, [
    '-f',
    'bestaudio[ext=m4a]',
    '--get-url'
  ]);

  return runYtDlp(args);
}

async function getVideoMetadata(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const args = getYtDlpArgs(url, [
    '--dump-json'
  ]);

  const json = await runYtDlp(args);

  return JSON.parse(json);
}

function streamDownload(videoId, res) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const args = getYtDlpArgs(url, [
      '-f',
      'bestaudio[ext=m4a]',
      '-o',
      '-'
    ]);
    const proc = spawn('yt-dlp', args);

    proc.stdout.pipe(res);

    proc.stderr.on('data', data => {
      process.stderr.write(data);
    });

    proc.on('error', reject);

    proc.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

(async () => {
  try {
    await ytmusic.initialize();

    app.listen(PORT, () => {
      console.log(
        `[SERVER] Listening on http://localhost:${PORT}`
      );
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

app.get('/music/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({
      error: 'Invalid video ID'
    });
  }

  try {
    const directUrl =
      await getDirectAudioUrl(videoId);

    return res.redirect(302, directUrl);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to resolve stream'
    });
  }
});

app.get('/music/download/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({
      error: 'Invalid video ID'
    });
  }

  res.setHeader('Content-Type', 'audio/mp4');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${videoId}.m4a"`
  );

  try {
    await streamDownload(videoId, res);
  } catch (err) {
    console.error(err);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download audio'
      });
    }

    res.destroy(err);
  }
});

app.get('/music/metadata/:videoId', async (req, res) => {
  try {
    const data = await getVideoMetadata(
      req.params.videoId
    );

    res.json({
      title: data.title,
      uploader: data.uploader,
      duration: data.duration,
      thumbnail: data.thumbnail,
      viewCount: data.view_count
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Metadata lookup failed'
    });
  }
});

app.get('/music/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      error: 'Missing q parameter'
    });
  }

  try {
    const results = await ytmusic.searchSongs(query);

    const sanitizedTracks = results
      .slice(0, 10)
      .map(track => ({
        title: track.name || 'Unknown Title',
        id: track.videoId,
        artists:
          (track.artists && track.artists.map(a => a.name)) ||
          ['Unknown Artist'],
        album:
          (track.album && track.album.name) || 'Single',
        durationSeconds:
          track.duration || 0,
        thumbnail:
          track.thumbnails && track.thumbnails.length
            ? track.thumbnails[track.thumbnails.length - 1].url
            : null,
        streamUrl:
          `/music/stream/${track.videoId}`
      }));

    res.json({
      success: true,
      query,
      results: sanitizedTracks
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error:
        'An internal error occurred while fetching music data.'
    });
  }
});
