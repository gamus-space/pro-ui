'use strict';

import fs from 'fs';
import path from 'path';
import process from 'process';
import { marked } from 'marked';
import { customEncodeURIComponent } from '../src/common.js';

const DB_URL = 'https://d1e7jf8j2bpzti.cloudfront.net';

if (process.argv.length < 3) {
    console.error('usage: ssg.js dir');
    process.exit(1);
}
const [,, dir] = process.argv;

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
    const textDb = await (await fetch(`${DB_URL}/text/index.json`)).json();
    for (const { platform, game, gameIndex } of Object.entries(musicDb).flatMap(([platform, games]) => Object.entries(games).map(([game, gameIndex]) => ({ platform, game, gameIndex })))) {
        if (process.platform === 'win32' && game.match(/[:"]/))
            continue;
        const songs = await (await fetch(`${DB_URL}/music/${gameIndex}`)).json();
        const textPath = textDb[platform]?.[game];
        const text = textPath && await (await fetch(`${DB_URL}/text/${textPath}`)).text();
        const textHtml = text && marked.parse(text);
        const content = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <title>GAMUS pro - ${game} ${platform} soundtrack</title>
            </head>
            <body>
            <script type="text/javascript">
                location = '/__' + location.pathname;
            </script>
            <h1>${game} ${platform} soundtrack</h1>
            <table>
            <thead>
                <tr><th>#</th><th>title</th><th>time</th><th>kind</th><th>artist</th></tr>
            </thead>
            <tbody>
                ${songs.map(({ ordinal, title, kind, time: t, artist }) =>
                    `<tr><td>${ordinal}</td><td>${title}</td><td>${time(t)}</td><td>${kind}</td><td>${artist}</td></tr>\n`
                ).join('')}
            </tbody>
            </table>
            <section>
                ${textHtml}
            </section>
            </body>
            </html>
        `;
        try {
            fs.mkdirSync(path.join(dir, platform));
        } catch(e) {}

        const contentPath = path.join(dir, platform, customEncodeURIComponent(game), 'index.html');
        try {
            fs.mkdirSync(path.join(dir, platform, customEncodeURIComponent(game)));
        } catch(e) {}
        fs.writeFileSync(contentPath, content, 'utf-8');
        console.log(`written: ${contentPath}`);

        if (game !== customEncodeURIComponent(game)) {
            const contentPath2 = path.join(dir, platform, game, 'index.html');
            try {
                fs.mkdirSync(path.join(dir, platform, game));
            } catch(e) {}
            fs.writeFileSync(contentPath2, content, 'utf-8');
            console.log(`written: ${contentPath2}`);
        }
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

    const compilationsDb = await (await fetch(`${DB_URL}/thumbs/compilations/index.json`)).json();
    try {
        fs.mkdirSync(path.join(dir, 'assets'));
    } catch(e) {}
    try {
        fs.mkdirSync(path.join(dir, 'assets', 'compilations'));
    } catch(e) {}
    let compilationsCount = 0;
    for (const { url } of compilationsDb.index) {
        const data = await (await fetch(`${DB_URL}/thumbs/compilations/${url}`)).arrayBuffer();
        fs.writeFileSync(path.join(dir, 'assets', 'compilations', url), Buffer.from(data));
        compilationsCount++;
    }
    console.log(`compilations saved: ${compilationsCount}`);
    const compilationsIndex = path.join(dir, 'assets', 'compilations', 'index.json');
    fs.writeFileSync(compilationsIndex, JSON.stringify(compilationsDb, null, 2));
    console.log(`written: ${compilationsIndex}`);
})();
