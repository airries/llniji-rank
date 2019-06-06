'use strict';
require('date-utils');
const request = require('request')
const { JSDOM } = require('jsdom');
const data = require('./data.json');

// Wikipediaの編集用の文字列を出力
const toStringForWikipedia = (title, data_rank) => {
    // 現在日時を取得（accessdate用）
    const dt = new Date();
    const dtf = dt.toFormat("YYYY-MM-DD");

    // ランク表示用の文字列（1-3位にはカラーコードも付与）
    let rank_str = [];
    data_rank.forEach(item => {
        switch (item.rank) {
            case 1:
                rank_str.push("bgcolor=#ffd700|1位");
                break;
            case 2:
                rank_str.push("bgcolor=#dcdcdc|2位");
                break;
            case 3:
                rank_str.push("bgcolor=#deb884|3位");
                break;
            default:
                rank_str.push(`${item.rank}位`);
                break;
        }
    });
    console.log(`|-`);
    console.log(`! ${year}年${month}月度<ref>{{Cite web|url=${url}|title=${title}|accessdate=${dtf}}}</ref>`);
    console.log(`| ${rank_str.join(" || ")}`);
}

// ランク順にメンバー名（CV）を出力
const toStringForName = (data_rank) => {
    // ランク順に配列をソート
    data_rank.sort((a, b) => {
        return a.rank - b.rank;
    });
    data_rank.forEach(item => {
        console.log(`${item.rank}位：${item.c_sei}${item.c_mei}（${item.v_sei}${item.v_mei}）`);
    });
}

if (process.argv.length < 4) {
    console.error("Error: Invalid argument");
    console.log("Usage: node llniji-rank.js <year> <month> [option]");
    process.exitCode = 1;
    return;
}

const year = parseInt(process.argv[2]);
const month = parseInt(process.argv[3]);
const url = `https://lovelive-as.bushimo.jp/vote/v${year}${`0${month}`.slice(-2)}/`;

request(url, (e, response, body) => {
    if (e) {
        console.error(e);
        process.exitCode = 1;
        return;
    }

    try {
        // HTMLの解析
        const dom = new JSDOM(body);
        const title = dom.window.document.title.valueOf().replace("»", "&raquo;");
        const liList = dom.window.document.querySelectorAll('body > main > section > div > article > div > ol > li');

        // dataにメンバーのランク情報を付与
        let data_rank = [];
        liList.forEach(elem => {
            const regexp = /^.*is-rank-| is-/g;
            // ['rank(number)', 'tag']
            const li = elem.className.split(regexp).slice(1);
            // ランクのタグとdataのタグが一致する要素を探索
            for (let i = 0; i < data.length; i++) {
                if (data[i].tag === li[1]) {
                    // dataの要素とランク情報を含めたオブジェクトをdata_rankにコピー
                    data_rank[i] = { ...data[i], rank: parseInt(li[0]) };
                    break;
                }
            }
        });
        if (data_rank.length === 0) {
            console.error("Error: Failed to get ranking information");
            process.exitCode = 1;
            return;
        }

        // オプションに応じて出力切り替え
        switch (process.argv[4]) {
            case "wiki":
                toStringForWikipedia(title, data_rank);
                break;
            case "name":
                toStringForName(data_rank);
                break;
            default:
                toStringForName(data_rank);
                break;
        }
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
        return;
    }
});
