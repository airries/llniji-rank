'use strict';
require('date-utils');
const request = require('request')
const { JSDOM } = require('jsdom');
const data = require('./data.json');

// Wikipediaの編集用の文字列を出力
const toStringForWikipedia = (data_rank) => {
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
                rank_str.push(item.rank + "位");
                break;
        }
    });
    console.log("|-");
    console.log(`! ${year}年${month}月度<ref>{{Cite web|url=${url}|title=ラブライブ！スクールアイドルフェスティバルALL STARS（スクスタ） &raquo; ${year}年${month}月度ランキング結果|accessdate=${dtf}}}</ref>`);
    console.log("| " + rank_str.join(" || "));
}

// ランク順にメンバー名（CV）を出力
const toStringForName = (data_rank) => {
    // ランク順に配列をソート
    data_rank.sort((a, b) => {
        return a.rank - b.rank;
    });
    data_rank.forEach(item => {
        console.log(item.rank + "位：" + item.c_sei + item.c_mei + "（" + item.v_sei + item.v_mei + "）");
    });
}

if (process.argv.length < 4) {
    console.error("Error: Invalid argument");
    console.log("Usage: node llniji-rank.js <year> <month> [option]")
    return;
}

const year = parseInt(process.argv[2]);
const month = parseInt(process.argv[3]);
const url = `https://lovelive-as.bushimo.jp/vote/v${year}${("0" + month).slice(-2)}/`;

request(url, (e, response, body) => {
    if (e) {
        console.error(e);
        return;
    }

    // ランク順にキャラののタグ（ayumu, kasumiなど）を追加
    let rank_tag = [];
    try {
        // HTMLの解析
        const dom = new JSDOM(body);
        const liList = dom.window.document.querySelectorAll('body > main > section > div > article > div > ol> li');
        liList.forEach(function (elem) {
            const regexp = /^.*is-rank-| is-/g;
            // ['rank(number)', 'tag']
            const li = elem.className.split(regexp).slice(1);
            rank_tag[parseInt(li[0] - 1)] = li[1];
        });
    } catch (e) {
        console.error(e);
        return;
    }
    if (rank_tag.length == 0) {
        console.error("Error: Failed to get ranking information");
        return;
    }

    // dataにメンバーのランク情報を付与
    let data_rank = []
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < rank_tag.length; j++) {
            if (data[i].tag === rank_tag[j]) {
                data_rank[i] = { ...data[i], rank: j + 1 };
            }
        }
    }

    // オプションに応じて出力切り替え
    switch (process.argv[4]) {
        case "wiki":
            toStringForWikipedia(data_rank);
            break;
        case "name":
            toStringForName(data_rank);
            break;
        default:
            toStringForName(data_rank);
            break;
    }
});
