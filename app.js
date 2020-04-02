const puppeteer = require('puppeteer');
const ids = require("./id_klient");
var fs = require('fs');
require('console-stamp')(console, { pattern: 'HH:MM:ss' });

var id
var liczbaNotatek
var output = []
var bledy = []
var klienci = ids.kl
// var klienci = [516, 511,512,514]

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

class Webpage {
    static async bot(url) {
        const browser = await puppeteer.launch({ headless: true }); // Puppeteer can only generate pdf in headless mode.
        const page = await browser.newPage();
        await page.goto(url); // Adjust network idle as required.
        await page.type('.username_help', '');
        await page.type('#form_basic_password', '');
        await page.keyboard.press('Enter');
        await page.waitForNavigation({waitUntil: 'load', timeout: 0});
        await page.evaluate(() => {
            [...document.querySelectorAll('.timelineTab')].find(element => element.textContent === 'Notatki').click(),{waitUntil: 'domcontentloaded'}
        });
        wait(500)
        liczbaNotatek = (await (await page.$$('.timeline')).length)
        wait(500)
        for(var i = 1;i <= liczbaNotatek;i++){

            //***************Autor
            var elements = await page.$$("#timeLineAfter > div:nth-child("+ i +") > div > div.timeline__content > div.timeline__detalis > div > p:nth-child(1) > a");
            if (elements[0] == undefined){
                autor = 'brak'
            } else {
                var autor = await (await elements[0].getProperty('textContent')).jsonValue();
            }

            //***************Data
            elements = await page.$$("#timeLineAfter > div:nth-child("+ i +") > div > div.timeline__content > span.timeline__type");
            if(elements[0] == undefined){
                data = 'brak'
            } else {
                var data = await (await elements[0].getProperty('textContent')).jsonValue();
            }

            //***************Notatki
            elements = await page.$$("#timeLineAfter > div:nth-child("+ i +") > div > div.timeline__content > div.timeline__detalis > span.timeline__detalis--more");
            if (elements[0] == undefined){
                elements = await page.$$("#timeLineAfter > div:nth-child("+ i +") > div > div.timeline__content > div.timeline__detalis > span.timeline__detalis--short");
                if(elements[0] == undefined){
                    var tresc = 'brak'
                } else {
                    var tresc1 = await (await elements[0].getProperty('textContent')).jsonValue();
                    var tresc = tresc1.trim()
                }
            } else {
                var tresc1 = await (await elements[0].getProperty('textContent')).jsonValue();
                var tresc = tresc1.trim()
            }

            if (autor == 'brak' || data == 'brak' || tresc == 'brak') {
                addToBlad()
            } else {
                addToOutput()
            }
        }
        // console.log("Autor i data: " + autor + " " + data)
        // console.log("Notatka: " + tresc)
        function addToOutput (){
            let notatka = {ID_Klient: id, Autor: autor, Data: data, Tresc: tresc}
            output.push(notatka)
            console.log("Dodano klienta " + id)
        }
        function addToBlad(){
            let blad = {ID_klienta: id, nrNotatki: i}
            bledy.push(blad)
            console.log("Dodano do błędów klienta " + id)
        }

        wait(500)
        // console.log("**********ZBIOR NOTATEK******* \n" + JSON.stringify(output))
        // console.log("Pobrano notatki klienta id " + id)
        browser.close()
    }
}

(async() => {
    for(i = 0; i <= klienci.length - 1; i++){
        id = klienci[i]
        const url = 'https://' + id;
        const buffer = await Webpage.bot(url);
        aktualny = i + 1
        console.log("Zgranych klientów " + aktualny + " / " + klienci.length)
    }
    saveOutput()
    saveBledy()
})();

function saveOutput(){
    fs.writeFile(
        './notatki.json',
        JSON.stringify(output),
        function (err) {
            if (err) {
                console.error('Crap happens');
            }
        }
    );
}

function saveBledy(){
    fs.writeFile(
        './bledy.json',
        JSON.stringify(bledy),
        function (err) {
            if (err) {
                console.error('Crap happens');
            }
        }
    );
}


