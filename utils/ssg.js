'use strict';

const fs = require('fs');
const path = require('path');
const process = require('process');

const DB_URL = 'https://d1e7jf8j2bpzti.cloudfront.net';

if (process.argv.length < 3) {
    console.error('usage: ssg.js dir');
    process.exit(1);
}
const [,, dir] = process.argv;

function customEncodeURIComponent(str) {
    return str.replace(/ /g, '_').replace(
        /[^/_\w():&]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}

function time(t) {
    t = Math.floor(t)
    const sec = t % 60;
    const minHr = Math.floor(t/60);
    const min = minHr % 60;
    const hr = Math.floor(minHr / 60);
    return `${hr === 0 ? '' : hr + ':'}${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

(async () => {
    const indexPath = path.join(dir, 'index.html');
    const index = fs.readFileSync(indexPath, 'utf-8');

    const musicDb = await (await fetch(`${DB_URL}/music/index.json`)).json();
    for (const { platform, game, gameIndex } of Object.entries(musicDb).flatMap(([platform, games]) => Object.entries(games).map(([game, gameIndex]) => ({ platform, game, gameIndex })))) {
        if (process.platform === 'win32' && game.match(/[:"]/))
            continue;
        const songs = await (await fetch(`${DB_URL}/music/${gameIndex}`)).json();
        const content = `
            <!DOCTYPE html>
            <html><body>
            <script type="text/javascript">
                location = '/__' + location.pathname;
            </script>
            <h1>${game} ${platform} soundtrack</h1>
            <ul>
                ${songs.map(({ ordinal, title, kind, time: t, artist }) =>
                    `<li>${ordinal} ${title} ${time(t)} ${kind} - ${artist}</li>\n`
                ).join('')}
            </ul>
            </body></html>
        `;
        const contentPath = path.join(dir, platform, game, 'index.html');
        try {
            fs.mkdirSync(path.join(dir, platform));
        } catch(e) {}
        try {
            fs.mkdirSync(path.join(dir, platform, game));
        } catch(e) {}
        fs.writeFileSync(contentPath, content, 'utf-8');
        console.log(`written: ${contentPath}`);
    };
    const gamesDb = await (await fetch(`${DB_URL}/index.json`)).json();
    const inject = `
        <script type="text/javascript">
            history.replaceState(undefined, '', location.pathname.replace(/^\\/__|\\/$/g, ''));
        </script>

        <section id="pre_list">
            <script type="text/javascript">
                document.getElementById('pre_list').style.display = 'none';
            </script>
            <h1>game soundtrack</h1>
            <ul>
                ${gamesDb.map(({ game, platform }) =>
                    `<li><a href="${platform}/${customEncodeURIComponent(game)}">${game} ${platform}</a></li>\n`
                ).join('')}
            </ul>
        </section>
    `;
    const newIndex = index.replace('<body>', `<body>${inject}`);
    fs.writeFileSync(indexPath, newIndex, 'utf-8');
    console.log(`injected: ${indexPath}`);
})();
