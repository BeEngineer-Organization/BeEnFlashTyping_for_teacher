//コードのリファクタリング
document.addEventListener("DOMContentLoaded",() => {
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
    const wordLength = 20
    const panelContainer = document.getElementById("panel-container");
    const wordCountText = document.getElementById("WordCount");
    const missMountText = document.getElementById("missMount");
    const timeText = document.getElementById("timeText");
    const otherResult = document.getElementById("other-result");
    const resultSection = document.getElementById("results");
    const wordMeanSection = document.getElementById("word-meanings");
    //効果音
    const clearSound = document.getElementById("type_clear")
    const missSound = document.getElementById("type_miss")
    const countSound = document.getElementById("count_down")
    const startSound = document.getElementById("start_sound")

    //フィッシャー・イェーツのシャッフル (Fisher-Yates Shuffle)    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            // 0からiまでのランダムなインデックスを生成
            const j = Math.floor(Math.random() * (i + 1));
            // array[i] と array[j] を入れ替える
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function displayTime() {
        const currentTime = new Date(Date.now() - startTime);
        const s = String(parseInt(currentTime.getMinutes()) * 60 + parseInt(currentTime.getSeconds())).padStart(2, "0");
        const ms = String(currentTime.getMilliseconds()).padStart(3, "0");
        timeText.textContent = `${s}.${ms}`;
        timeoutID = setTimeout(displayTime, 10);
    }    
    
    function wordObjListMake(data){
        const lines = data.split("\n")
        shuffleArray(lines)
        for(let i=0;i<20;i++){
            let word = lines[i].split(",");
            wordObjList.push({
                "is_finish": false,
                "untyped": word[0],
                "typed": "",
                "word": word[0],
                "remarks": word[1],
                "letterLength":word[0].length,
            });
        };
    }

    function createPanels() {
        panelContainer.innerHTML = "";
        for (let i = 0; i < wordLength ; i++) {
            const panel = document.createElement("div");
            const typedSpan = document.createElement("span");
            const untypedSpan = document.createElement("span");
            const delay = Math.random() * 2;
            panel.style.animationDelay = `${delay}s`;
            
            typedSpan.id = "typed-"+i
            typedSpan.className = "typed"
            untypedSpan.id = "untyped-"+i 
            untypedSpan.className = "untyped" 
            panel.className = "panel";
            panel.id = "panel-" + i;

            untypedSpan.textContent = wordObjList[i]["untyped"];
            letterCount += wordObjList[i]["letterLength"];
            
            panel.appendChild(typedSpan);
            panel.appendChild(untypedSpan);
            panelContainer.appendChild(panel);
            panel.addEventListener("mouseenter",(event) => {
                if (startFlag == 3) {
                    event.target.firstElementChild.textContent = ""
                    event.target.lastElementChild.textContent = wordObjList[i]["remarks"]
                }
            })
            panel.addEventListener("mouseleave",(event) =>{
                if(startFlag == 3){
                    event.target.firstElementChild.textContent = wordObjList[i]["typed"]
                    event.target.lastElementChild.textContent = wordObjList[i]["untyped"]
                }
            })
        }
        //最初のはここで光らせて置く。
        document.getElementById("panel-0").classList.add("active")
    }

    // 重なりなし
    function randomPanelPlacement() {
        let isPlaceMiss = false;
        const container = document.getElementById("panel-container");
        // HTMLCollectionを配列に変換してforEachを使えるようにする
        const panels = Array.from(container.getElementsByClassName("panel"));
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const panelSize = panels[0].clientWidth;// 円の直径
        const panelRadius = panelSize / 2; // 円の半径

        // 配置済み円の中心座標を保持する配列
        const placedCenters = [];
        const maxAttempts = 1000;

        panels.forEach(panel => {
            let newPosition = null;
            let attempts = 0; // 無限ループを避けるための試行回数上限

            while (attempts < maxAttempts) {
                // パネルのサイズ分を引いて画面からはみ出ないように設定する
                const randomLeft = Math.random() * (containerWidth - panelSize);
                const randomTop = Math.random() * (containerHeight - panelSize);
                
                const newCenter = {
                    x: randomLeft + panelRadius,
                    y: randomTop + panelRadius,
                };

                // some() を使って、いずれかの既存の円と重なるかチェック
                const isOverlapping = placedCenters.some(placedCenter => {
                    const dx = newCenter.x - placedCenter.x;
                    const dy = newCenter.y - placedCenter.y;
                    // Math.sqrtを避け（処理の高速化）、距離の2乗で比較する
                    return (dx * dx + dy * dy) < (panelSize * panelSize);
                });

                // 重なっていなければ、その位置を採用してループを抜ける
                if (!isOverlapping) {
                    newPosition = { left: randomLeft, top: randomTop, center: newCenter };
                    break;
                }
                attempts++;
            }

            if (newPosition) {
                panel.style.left = `${newPosition.left}px`;
                panel.style.top = `${newPosition.top}px`;
                placedCenters.push(newPosition.center);
            } else {
                isPlaceMiss = true
            }
        });
        if (isPlaceMiss){
            window.alert("うまく単語プレートを配置できませんでした。画面が小さすぎる可能性があります。\n再読込します。")
            location.reload()
        }
    }

    function highlightCurrentPanel() {
        let currentPanel = document.getElementById(`panel-${current-1}`);
        let nextPanel = document.getElementById(`panel-${(current)}`)
        //一番外側のif,elseはなくてもいい。
        if(currentPanel.classList.contains("active")){
            currentPanel.classList.remove("active");
            currentPanel.classList.add("faded");
            if(nextPanel){
                nextPanel.classList.add("active")
            }
        }else{
            currentPanel.classList.add("active");
        }
    }
    
    function inputCheck(key){
        typeCount += 1;

        // 正解のキーをタイプしたら
        if(key == wordObjList[current]["untyped"].charAt(0)){
            clearSound.currentTime = 0;
            clearSound.play();
            
            wordObjList[current]["typed"] = wordObjList[current]["typed"] + wordObjList[current]["untyped"].charAt(0);
            wordObjList[current]["untyped"] = wordObjList[current]["untyped"].substring(1);
            typedText.textContent = wordObjList[current]["typed"]
            untypedText.textContent = wordObjList[current]["untyped"]
            // ラスト1文字→次のワードへ
            if(wordObjList[current]["untyped"].length == 0){
                
                current += 1;
                //currentは、＋１をすでにやっているので、０からスタートしているが、プレイヤーには１から語数を数えているように思える。
                wordCountText.textContent = current;
                // ゲームの最終単語→ゲーム終了
                if(current == wordLength){
                    processEndGame()
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
            missMountText.innerText = missTypeCount;
        }
    }

    function resultIndicate(){
        const table = document.getElementById("word-table");
        wordObjList.forEach(element => {
            let tableRow = document.createElement("div");
            let tableDataWord = document.createElement("p");
            let tableDataRemarks = document.createElement("p");
            
            tableDataWord.textContent = element["word"];
            tableDataRemarks.textContent = element["remarks"]
            
            tableRow.classList.add("typed-words")
            tableDataWord.classList.add("words")
            tableDataRemarks.classList.add("words")
            
            tableRow.appendChild(tableDataWord);
            tableRow.appendChild(tableDataRemarks);
            table.appendChild(tableRow);
        })
        wordMeanSection.style.display = "block";
        resultSection.style.display = "flex";
    }

    function processEndGame(){
        clearTimeout(timeoutID);
        const scoreText = document.getElementById("score");
        
        const stopTime = (Date.now() - startTime);
        const score = parseInt((letterCount + missTypeCount) / stopTime * 60000 * (letterCount / (letterCount + missTypeCount)) ** 3);
        scoreText.textContent = `SCORE : ${score}`;
        otherResult.textContent = `合計入力文字数（ミスを含む):${typeCount}`;
        // 全パネルのハイライトを消す
        for (let i = 0; i < wordLength; i++) {
            const panel = document.getElementById("panel-" + i);
            if (panel) {
                panel.classList.remove("active","faded");
                panel.style.animation = "none";
            }    
        }
        startFlag = 3
        resultIndicate();
        window.scrollTo({
            top: 700,      // 縦スクロールの位置
            left: 0,     // 横スクロールの位置（通常は 0 のままでOK）
            behavior: "smooth"
        })
    }

    //ジャンル選択用
    const genre = document.getElementById("genre")
    const genreBtns = document.querySelectorAll(".genre_btn");
    //最初にマッチするもの（位置番上に書いているもの）を認識する。
    let radioInput = document.querySelector("input[name='genre']");

    genreBtns.forEach(element => {
        element.querySelector("input").addEventListener("click",(event) => {
            let newRadioInput = event.target;
            //今まで選択していたradioボタンと異なれば
            if(radioInput !== newRadioInput){
                genre.value = newRadioInput.value;
                newRadioInput.parentElement.classList.add("active-genre");
                radioInput.parentElement.classList.remove("active-genre");
            }
            newRadioInput.blur();
            radioInput = newRadioInput;
        });
    });

    window.addEventListener("keydown", (event) => {
        if(startFlag == 0 && event.key == " "){
            startFlag = 1;
            const infoBox = document.getElementById("info")
            for (let i = 3,j=0; i >= 1; i--,j++) {
                setTimeout(() => {
                    infoBox.innerText = i;
                    countSound.currentTime = 0;
                    countSound.play();
                }, j*1000)
            }
            setTimeout(async ()=> {
                startFlag = 2;
                infoBox.innerText = "";
                startTime = Date.now();
                startSound.currentTime = 0;
                startSound.play();
                await fetch(`csv/word-${genre.value}.csv`).then(response => response.text()).then(data => wordObjListMake(data))
                displayTime();
                createPanels();
                randomPanelPlacement()
                typedText = document.getElementById(`typed-${current}`);
                untypedText = document.getElementById(`untyped-${current}`);
            },3000);
        }
        
        else if(startFlag == 2 && event.key.length < 2 && event.key.match(/^[a-zA-Z0-9!-/:-@¥[-`{-~\s]*$/)){
            inputCheck(event.key);
        }
        else if(startFlag == 3 && (event.key =="Enter" || event.key == "Escape")){
            this.location.reload()
        }
    })
})