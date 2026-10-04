import express from "express";
import fs from "fs/promises";
import pkg from "natural";
import preprocess from "./utils/preprocess.js";


const {TfIdf} = pkg;

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("."));

let problems = [];
let tfidf = new TfIdf();


//store each document's tf-ifd vector and its magnitude

let docvectors = [];
let docmagnitudes = [];

async function loadproblemsandbuildindex(){
    const data = await fs.readFile("./corpus/all_problems.json","utf-8");
    problems = JSON.parse(data);

    tfidf = new TfIdf();

    //add documents : title boosted by duplicating, plus description

    problems.forEach((problem,idx) => {
        const text = preprocess(
            `${problem.title} ${problem.title} ${problem.description || ""}`          
        );
        tfidf.addDocument(text,idx.toString());
    });


    //build document vectros and magnitudes for cosine similarity

    docvectors = [];
    docmagnitudes = [];
    problems.forEach((_,idx) => {
        const vector = {};
        let sumsquares = 0;

        tfidf.listTerms(idx).forEach(({term, tfidf: weight}) => {
            vector[term] = weight;
            sumsquares += weight * weight;
        });

        docvectors[idx] = vector;
        docmagnitudes[idx] = Math.sqrt(sumsquares);
    });
    
}


app.post("/search",async (req,res) => {
const rawquery = req.body.query;

if(!rawquery || typeof rawquery !== "string"){
    return res.status(400).json({error:"missing or invalid 'query'"});
}

//preprocess query and tokenise
const query = preprocess(rawquery);
const tokens = query.split(" ").filter(Boolean);

//build the query tfxidf vector
const termfreq = {};
tokens.forEach((t) => {
    termfreq[t] = (termfreq[t] || 0) + 1;
});

const queryvector = {};
let sumsqq = 0;
const N = tokens.length;
Object.entries(termfreq).forEach(([term,count]) => {
    const tf = count / N;
    const idf = tfidf.idf(term);
    const w = tf * idf;
    queryvector[term] = w;
    sumsqq += w * w;
});
const querymag = Math.sqrt(sumsqq) || 1;


const scores = problems.map((_,idx) => {
    const docvec = docvectors[idx];
    const docmag = docmagnitudes[idx] || 1;

    let dot = 0;

    for(const [term,wq] of Object.entries(queryvector)){
        if(docvec[term]){
            dot += wq * docvec[term];
        }
    }

    const cosine = dot/(querymag * docmag);
    return {idx, score:cosine};
});

//take top 10 results
const top = scores
.filter((s) => s.score > 0)
.sort((a,b) => b.score - a.score)
.slice(0,10)
.map(({idx}) => {
    const p = problems[idx];
    const platform = p.url.includes("leetcode.com")
    ? "leetcode"
    : "codeforces";
    return { ...p,platform};
});

res.json({results: top});
});


loadproblemsandbuildindex().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);     
    });
})



