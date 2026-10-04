import puppeteer from "puppeteer";
import fsPromises from "fs/promises"

async function scrapeLeetcodeproblems() {;
const browser = await puppeteer.launch({
    headless:false,
    defaultViewport:null,
    args:[ "disable-blink-features=AutomationControlled" ],   // this is to avoid detection of puppeteer by the website
});
const page = await browser.newPage();

await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)" +
     "AppleWebKit/537.36 (KHTML, like Gecko)" +" Chrome/88.0.4324.150 Safari/537.36");

await page.goto("https://leetcode.com/problemset/all/",{
    waitUntil: "domcontentloaded",
});

    const problemselector = "a.group.flex.flex-col.rounded-\\[8px\\].duration-300"


    let allproblems = [];
    let prevcount = 0;
    const TARGET = 500;

    while(allproblems.length < TARGET){
        await page.evaluate((sel) => {
            const currentproblemonpage  = document.querySelectorAll(sel);

            if(currentproblemonpage.length){
                currentproblemonpage[currentproblemonpage.length - 1].scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
            }
        }, problemselector);

        
        
        await page.waitForFunction( 
            (sel,prev) => document.querySelectorAll(sel).length > prev, 
            {},
            problemselector, 
            prevcount
        );


        allproblems = await page.evaluate( (sel) => {
            const nodes = Array.from(document.querySelectorAll(sel));

            return nodes.map((el) => ({
                title: el.querySelector(".ellipsis.line-clamp-1")?.textContent.trim().
                split(". ")[1],
                url: el.href,
            }));
        }, problemselector)

        prevcount =  allproblems.length;

    }

    const problemswithdescription = [];

    for(let i = 0;i < TARGET;i ++){
        const{title,url} = allproblems[i];
        const problempage = await browser.newPage();

        
        try {
            await problempage.goto(url);

            let description = await problempage.evaluate( () => {
                const descriptiondiv = document.querySelector(
                    'div.HTMLContent_html__0OZLp[data-track-load="description_content"]'
                );

                const paragraphs = descriptiondiv.querySelectorAll("p");

                let collecteddescription = [];
                for(const p of paragraphs){
                    if(p.innerHTML.trim() === "&nbsp;"){
                        break;
                    }
                    collecteddescription.push(p.innerText.trim());
                }

                return collecteddescription.filter((text) => text !== "").join("");
            });

            problemswithdescription.push({title,url,description});
            
        } catch (err) {

            console.error(`ERROR FETCHING DECSCRIPTION FOR ${title} (${url}):`,err)
        }  finally{
            await problempage.close();
        }



    }

    await fsPromises.mkdir("./problems", {recursive:true});   //we're asking nodejs to create a dir, recursive true means if directory already exists , dont throw a error,just move ahead without causing any error

    await fsPromises.writeFile(
        "./problems/leetcode_problems.json",
        JSON.stringify(problemswithdescription,null,2)    // null 2 basically indentation h data par
    );

    await browser.close();
}






async function scrapecodeforcesproblem(){
    const browser = await puppeteer.launch({
        headless:false,
        defaultViewport:null,
        args:["--disable-blink-features=AutomationControlled"],
    });

    const page = await browser.newPage();


    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)" +
     "AppleWebKit/537.36 (KHTML, like Gecko)" +" Chrome/114.0.5735.199 Safari/537.36");


     const problems = [];
     const TARGET = 5;

     for(let i =1; i<TARGET;i++){
        const url = `https://codeforces.com/problemset/page/${i}`;

        await page.goto(url,{waitUntil:"domcontentloaded" });

        const problemselector = "table.problems tr td:nth-of-type(2) > div:first-of-type > a";

        const links = await page.evaluate( (sel) => {
            const anchors = document.querySelectorAll(sel);
        
            return Array.from(anchors).map( (a) => a.href);  //basically now the links is an array of links of all problems
        }, problemselector)


        for(let i = 0;i<102;i++){
            const link = links[i];
            
            try {

                await page.goto(link, {waitUntil:"domcontentloaded"});

                const {title, description} = await page.evaluate(() => {
                    const title  = document.querySelector(".problem-statement .title" )
                    .textContent.split(". ")[1];

                    const description = document.querySelector
                    (".problem-statement > div:nth-of-type(2)").textContent;

                    return {title,description};
                })

                problems.push({
                    title,
                    url:link,
                    description,
                });

            } catch (err) {
                console.warn(`failed to scrape ${link}: ${err.message}`);                
            }
        }

     }

     await fsPromises.mkdir("./problems",{recursive:true});

     await fsPromises.writeFile(
        "./problems/codeforces_problems.json",
        JSON.stringify(problems,null,2)
     );


     await browser.close();


}



scrapecodeforcesproblem();


// scrapeLeetcodeproblems();


