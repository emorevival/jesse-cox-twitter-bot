require('dotenv').config();
const { google } = require('googleapis');
const { TwitterApi } = require('twitter-api-v2');
const UPLOADS_PLAYLIST_ID = 'UUCbfB3cQtkEAiKfdRQnfQvw';
const CHANNEL_ID = 'UCCbfB3cQtkEAiKfdRQnfQvw';
const COXCLIPS_UPLOADS_PLAYLIST_ID = 'UUWD1nEswRjSCFTYKXYuEDuw';
const COXCLIPS_CHANNEL_ID = 'UCWD1nEswRjSCFTYKXYuEDuw';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

const baseTwitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  // Following access tokens are not required if you are
  // at part 1 of user-auth process (ask for a request token)
  // or if you want a app-only client (see below)
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const twitterClient = baseTwitterClient.readWrite;

let data = [];
async function getAllVideosFromPlaylist(playlistId, pageToken) {
  let res;
  if (!pageToken) {
    res = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId,
      maxResults: 50,
    });
  }
  if (pageToken) {
    res = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId,
      maxResults: 50,
      pageToken,
    });
  }

  data.push(res.data.items);

  if (res.data.hasOwnProperty('nextPageToken')) {
    return getAllVideosFromPlaylist(playlistId, res.data.nextPageToken);
  } else {
    return data;
  }
}

function getTweetContent(videos) {
  const numberOfVideos = Object.keys(videos).length;
  const videoPosition = Math.floor(Math.random() * numberOfVideos);
  const video = videos[videoPosition];
  const videoLink = `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`;
  const videoTitle = video.snippet.title;
  const videoPostedAt = new Date(video.snippet.publishedAt);

  return `Today's Jesse Cox video of the day is ${videoTitle} posted on ${videoPostedAt.toLocaleDateString()} at ${videoPostedAt.toLocaleTimeString()}: 
  
  ${videoLink}`;
}

(async function () {
  let mainChannelResult = await getAllVideosFromPlaylist(UPLOADS_PLAYLIST_ID);
  let mainChannelVideos = JSON.parse(JSON.stringify(mainChannelResult)).flat();

  let clipsChannelResult = await getAllVideosFromPlaylist(
    COXCLIPS_UPLOADS_PLAYLIST_ID
  );
  let clipsChannelVideos = JSON.parse(
    JSON.stringify(clipsChannelResult)
  ).flat();

  const allVideos = {
    ...mainChannelVideos,
    ...clipsChannelVideos,
  };

  await twitterClient.v2.tweet(getTweetContent(allVideos));
})();
