import fsPromises from 'fs/promises';
import path from 'path';   

async function mergeproblems(){

    const codeforcespath  = path.resolve("problems/codeforces_problems.json");
    const leetcodepath  = path.resolve("problems/leetcode_problems.json");      // we hv an absolute path of these two files
    
    const codeforcesdata = JSON.parse(
        await fsPromises.readFile(codeforcespath,"utf-8")
    )
    const leetcodedata = JSON.parse(
        await fsPromises.readFile(leetcodepath,"utf-8")     // read 2 files and parse , conver the json string to a normal js object/array
    )

    const combined = [...codeforcesdata, ...leetcodedata];

    await fsPromises.mkdir("./corpus",{reursive:true});

    await fsPromises.writeFile(
        "./corpus/all_problems.json",
        JSON.stringify(combined,null,2)
    )

}

mergeproblems();