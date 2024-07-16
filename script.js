import pw from 'playwright';
import retry from 'async-retry'
import fs from 'fs';

async function takeScreenshot(page, log){
    console.log(log || 'Taking screenshot to page.png');
    await page.screenshot({ path: 'page.png', fullPage: true});
}

async function main(){
    const browser = await pw.firefox.launch();
    const page = await browser.newPage();
    let vocabOutput = "";
    let readingOutput = "";
    try{
        //vocab scrap
        // await page.goto('https://japanesetest4you.com/jlpt-n1-vocabulary-list/', {timeout: 1 * 60 * 1000});
        // const test = await page.locator('div.entry.clearfix').locator('p').all();
        // for(let line of test){
        //     line = await line.evaluate(line => line.textContent.split(' ')[0]);
        //     if(!line || line.charCodeAt(0) < 100)continue;
        //     vocabOutput += `${line}\n`;
        // }

        await page.goto('https://japanesetest4you.com/category/jlpt-n1/jlpt-n1-reading-test/', {timeout: 1 * 60 * 1000});
        const buttons = await page.getByText('Read More').all();
        const amountOfButtons = buttons.length;
        let counter = 0;
        for(let button of buttons){
            console.log(`Opening exercise number ${++counter}/${amountOfButtons}`);
            await button.click();
            const content = await page.locator('div.entry.clearfix').locator('p').all();
            let vocabLeft = false;
            for(let line of content){
                line = await line.evaluate(line => line?.textContent);
                if(!line)continue;
                if(vocabLeft)line = line.charCodeAt(0) < 100 ? '' : line.split(' ')[0];
                if(line.includes('New words'))vocabLeft = true;
                if(!line)break;
                readingOutput += `${line}\n`;
            }
            await page.goBack();
        }

    }catch(err){
        await takeScreenshot(page, 'Error');
    }finally{
        await browser.close();
        fs.writeFileSync('JLPT_N1_reading.txt', readingOutput);
    }
}

await retry(main, {
    retries: 3,
    onRetry: err => console.log(' retrying ...', err)
})