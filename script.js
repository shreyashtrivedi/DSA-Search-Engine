const form = document.getElementById("search-form");
const input = document.getElementById("query-input");
const resultdiv = document.getElementById("results");
const spinner = document.getElementById("spinner");

form.addEventListener("submit",async(e) => {
    e.preventDefault();

    const query = input.value.trim();
    if(!query) return;

    resultdiv.innerHTML = "";
    spinner.classList.remove("hidden");


    try {
        const res = await fetch("/search",{
            method: "POST",
            headers:{"Content-Type": "application/json"},
            body: JSON.stringify( {query} ),
        })

        if(!res.ok) throw new Error(`Server error ${res.status}`);

        const {results} = await res.json();

        spinner.classList.add("hidden");

        if(results.length === 0){
            resultdiv.innerHTML = "<p> No matches found. </p>"
            return;
        }

        resultdiv.innerHTML = results
        .map((r,i) => {
            return `
            <div class = "card${ i===0 ? " featured" : ""}">
            <div class = "card-header">
            <img src = "assets/${r.platform.toLowerCase()}.png"
            alt="${r.platform} logo"
            class="platform-logo"/>
            <a href="${r.url}" target="_blank" class="card-title">
            [${r.platform}] ${r.title}
            </a>
        </div>
    </div>
`;
}).join("");


    } catch (error) {
        spinner.classList.add("hidden");
        console.log(err);
        resultdiv.innerHTML = `<p> Error: ${error.message}</p>`;
    }
})