document.addEventListener("DOMContentLoaded",() => {
    const timeText = document.getElementById("timeText");
    let timeoutID;
    let startFlag = 0; // 0→開始前、１→開始待機、２→ゲーム中、３→終了
    let startTime;
    let missTypeCount = 0;
    let typeCount = 0;
    let current = 0;
    let letterCount= 0;
    let typedText;
    let untypedText;

    const wordObjList = [];
    const wordLength = 20;
    const panelContainer = document.getElementsByClassName("panel-container")[0];
    const wordCountText = document.getElementById("wordCount");
    // wordLenghtに合わせて表示を動的に変更する。（cssを手動で変更する必要がある。）
    document.getElementById("wordLength").textContent = `/${wordLength}`;
    const missMountText = document.getElementById("missMount");
    const infoBox = document.getElementById("info");
    const scoreText = document.getElementById("score");
    const otherResult = document.getElementById("other-result");
    const resultSection = document.getElementById("results");

    const clearSound = document.getElementById("type_clear");
    const missSound = document.getElementById("type_miss");
    const countSound = document.getElementById("count_down");
    const startSound = document.getElementById("start_sound");

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            // 0からiまでのランダムなインデックスを生成
            const j = Math.floor(Math.random() * (i + 1));
            // array[i] と array[j] を入れ替える
            [array[i], array[j]] = [array[j], array[i]];
        };
        return array;
    };

    function wordObjListMake(data){
        const lines = data.split("\n");
        shuffleArray(lines);
        for(let i=0;i<wordLength;i++){
            let word = lines[i].split(",");
            wordObjList.push({
                "untyped": word[0],
                "typed": "",
                "word": word[0],
                "letterLength":word[0].length,
            });
        };
    };

    function displayTime() {
        const currentTime = Date.now() - startTime;
        const s = String(Math.floor(currentTime / 1000)).padStart(2, "0");
        const ms = String(currentTime % 1000).padStart(3, "0");
        timeText.textContent = `${s}.${ms}`;
        timeoutID = setTimeout(displayTime, 10);
    }

    function createPanels() {
        panelContainer.innerHTML = "";
        for (let i = 0; i < wordLength ; i++) {
            const panel = document.createElement("div");
            const typedSpan = document.createElement("span");
            const untypedSpan = document.createElement("span");

            panel.id = "panel-" + i;
            panel.className = "panel";
            typedSpan.id = "typed-"+i;
            typedSpan.className = "typed";
            untypedSpan.id = "untyped-"+i;
            untypedSpan.className = "untyped"

            untypedSpan.textContent = wordObjList[i]["untyped"];
            letterCount += wordObjList[i]["letterLength"];

            panel.appendChild(typedSpan);
            panel.appendChild(untypedSpan);
            panelContainer.appendChild(panel);
        }
        panelContainer.classList.add("panel-container-play");
        //最初のパネルはここで光らせておく。
        document.getElementById("panel-0").classList.add("active");
    }

    function highlightCurrentPanel() {
        let currentPanel = document.getElementById(`panel-${current - 1}`);
        let nextPanel = document.getElementById(`panel-${current}`);
        currentPanel.classList.remove("active");
        currentPanel.classList.add("faded");
        nextPanel.classList.add("active");
    };

    function processStartGame (){
        //1
        for (let i = 3, j = 0; i >= 1; i--, j++) {
            setTimeout(() => {
                infoBox.textContent = i;
                countSound.currentTime = 0;
                countSound.play();
            }, j*1000);
        };
        //2
        setTimeout(async ()=> {
            startFlag = 2;
            infoBox.textContent = "";
            await fetch(`csv/word-${level}.csv`)
                .then(response => response.text())
                .then(data => wordObjListMake(data));
            createPanels();
            startSound.currentTime = 0;
            startSound.play();
            startTime = Date.now();
            displayTime();
            typedText = document.getElementById(`typed-${current}`);
            untypedText = document.getElementById(`untyped-${current}`);
        },3000);
    }

    function inputCheck(key){
        // Userの入力数カウント用の変数をインクリメントする。
        typeCount += 1;

        // 正解のキーをタイプしたら
        if(key == wordObjList[current]["untyped"].charAt(0)){
            // 音声再生ごとに、最初から流れるようにする。
            clearSound.currentTime = 0;
            clearSound.play();

            wordObjList[current]["typed"] = wordObjList[current]["typed"] + wordObjList[current]["untyped"].charAt(0);
            wordObjList[current]["untyped"] = wordObjList[current]["untyped"].substring(1);

            typedText.textContent = wordObjList[current]["typed"]
            untypedText.textContent = wordObjList[current]["untyped"]

            // ラスト1文字→次のワードへ
            if(wordObjList[current]["untyped"].length == 0){

                //1単語分終了したので、current インデックスをインクリメントする。
                current += 1;
                wordCountText.textContent = current;
                // ゲームの最終単語→ゲーム終了
                if(current == wordLength){
                    processEndGame();
                }
                else{
                    highlightCurrentPanel();
                    typedText = document.getElementById(`typed-${current}`)
                    untypedText = document.getElementById(`untyped-${current}`)
                }
            }
        }
        else{
            missSound.currentTime = 0;
            missSound.play();
            missTypeCount += 1;
            missMountText.textContent = missTypeCount;
        }
    }

    function processEndGame(){
        clearTimeout(timeoutID);
        const stopTime = (Date.now() - startTime);
        const score = parseInt((typeCount / stopTime) * 60000 * (letterCount / typeCount) ** 3);
        scoreText.textContent = `SCORE : ${score}`;
        otherResult.textContent = `合計入力文字数（ミスを含む):${typeCount}`;
        resultSection.style.display = "flex";
        // 全パネルのハイライトを消す
        for (let i = 0; i < wordLength; i++) {
            const panel = document.getElementById("panel-" + i);
            panel.classList.remove("active","faded");
        };
        startFlag = 3;
        window.scrollTo({
            top: 100,      // 縦スクロールの位置
            left: 0,     // 横スクロールの位置（通常は 0 のままでOK）
            behavior: "smooth"
        });
    };

    //ジャンル選択用
    const levelBtns = document.querySelectorAll(".level_btn");
    //active-leveクラスがついたlabelタグの子要素のinputタグを取得する。
    let radioInput = document.querySelector(".active-level input");
    let level = radioInput.value;

    function handleLevelChange(newRadioInput){
        //今まで選択していたradioボタンと異なれば
        if(radioInput !== newRadioInput){
            level = newRadioInput.value;
            newRadioInput.parentElement.classList.add("active-level");
            radioInput.parentElement.classList.remove("active-level");
            radioInput = newRadioInput;
        };

    }

    levelBtns.forEach(element => {
        element.querySelector("input").addEventListener("click",(event) => {
            handleLevelChange(event.target);
        });
    });

    window.addEventListener("keydown", (event) => {
        if(startFlag == 0 && event.key == " "){
            startFlag = 1
            processStartGame();
        }
        else if(startFlag == 2 && event.key.length == 1 && event.key.match(/^[a-zA-Z0-9!-/:-@\[-`{-~\s]*$/)){
            inputCheck(event.key);
        }
        else if(startFlag == 3 && (event.key =="Enter" || event.key == "Escape")){
            this.location.reload();
        };
    })
});