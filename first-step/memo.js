document.addEventListener("DOMContentLoaded",function() {
    let timeoutID;
    let startFlag = 0; // 0→開始前、１→ゲーム中、３→終了
    let startTime;
    let missTypeCount = 0;
    let typeCount = 0;
    let current = 0;
    let letterCount= 0;
    // 小変更＋追加
    let typedKana;
    let untypedKana;
    let typedEn;
    let untypedEn;

    const wordObjList = [];
    const wordLength = 20
    const infoBox = document.getElementById("info");
    const panelContainer = document.getElementsByClassName("panel-container")[0];
    const wordCountText = document.getElementById("WordCount");
    const missMountText = document.getElementById("missMount");
    const timeText = document.getElementById("timeText");
    const otherResult = document.getElementById("other-result");
    const resultSection = document.getElementById("results");

    //効果音
    const clearSound = document.getElementById("type_clear")
    const missSound = document.getElementById("type_miss")
    const countSound = document.getElementById("count_down")
    const startSound = document.getElementById("start_sound")

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

    //ライブラリ用変更
    function wordObjListMake(data){
        const lines = data.split("\n")
        shuffleArray(lines)
        for(let i=0;i<wordLength;i++){
            let word = lines[i].split(",")
            wordObjList.push(
                new Word(word[0],word[1])
            )
        }
    }
    // 大変更
    function createPanels() {
        panelContainer.innerHTML = "";
        for (let i = 0; i < wordLength ; i++) {
            const panel = document.createElement("div");
            const jpWord = document.createElement("h2")
            const kanaBox = document.createElement("h3")
            const enBox = document.createElement("h3")
            const typedKana = document.createElement("span");
            const untypedKana = document.createElement("span");
            const typedEn = document.createElement("span");
            const untypedEn = document.createElement("span");
            
            jpWord.id = "jp_word"
            jpWord.textContent = wordObjList[i].example

            typedKana.id = "kana_typed-"+i
            typedKana.className = "typed"

            untypedKana.id = "kana_untyped-"+i
            untypedKana.className = "untyped"
            untypedKana.textContent = wordObjList[i].kana.untyped;

            typedEn.id = "en_typed-"+i
            typedEn.className = "typed"

            untypedEn.id = "en_untyped-"+i
            untypedEn.className = "untyped"
            untypedEn.textContent = wordObjList[i].roman.untyped

            panel.id = "panel-" + i;
            panel.className = "panel";

            letterCount += wordObjList[i].roman.all.length;
            
            kanaBox.appendChild(typedKana)
            kanaBox.appendChild(untypedKana)

            enBox.appendChild(typedEn)
            enBox.appendChild(untypedEn)

            panel.appendChild(jpWord);
            panel.appendChild(kanaBox);
            panel.appendChild(enBox);

            panelContainer.appendChild(panel);
            panelContainer.classList.add('panel-container-play')
        }
        // 後半部分は消しておく。
        for(let i = 10;i < wordLength;i++){
            document.getElementById(`panel-${i}`).style.display = 'none'
        }
        //最初のパネルはここで光らせて置く。
        document.getElementById("panel-0").classList.add("active")
    };


    function highlightCurrentPanel() {
        let currentPanel = document.getElementById(`panel-${current-1}`);
        let nextPanel = document.getElementById(`panel-${(current)}`)

        currentPanel.classList.remove("active");
        currentPanel.classList.add("faded");
        nextPanel.classList.add("active")
    }

    // 追加
    function secondFase(){
        for(let i = 0;i < wordLength/2;i++){
            document.getElementById(`panel-${i}`).style.display = 'none'
            document.getElementById(`panel-${i+10}`).style.display = 'flex'
        }
    }

    function processStartGame(){
        for (let i = 3,j=0; i >= 1; i--,j++) {
            setTimeout(() => {
                infoBox.textContent = i;
                countSound.currentTime = 0;
                countSound.play();
            }, j*1000)
        }
        setTimeout(async ()=> {
            startFlag = 1;
            infoBox.textContent = "";
            startTime = Date.now();
            startSound.currentTime = 0;
            startSound.play();
            await fetch(`csv/word-ja.csv`).then(response => response.text()).then(data => wordObjListMake(data))
            displayTime();
            createPanels();
            // 日本語用に変更
            typedKana = document.getElementById(`kana_typed-${current}`);
            untypedKana = document.getElementById(`kana_untyped-${current}`);
            typedEn = document.getElementById(`en_typed-${current}`);
            untypedEn = document.getElementById(`en_untyped-${current}`);
        },3000);
    }

    // ライブラリ用に変更
    function inputCheck(key){
        // Wordオブジェクトのtypedメソッド→正しい文字か、その文字が終了したかを判断できる
        const { isMiss, isFinish } = wordObjList[current].typed(key);
        typeCount += 1;
        if(!isMiss){
            clearSound.currentTime = 0;
            clearSound.play();
            typedKana.textContent = wordObjList[current].kana.typed;
            untypedKana.textContent = wordObjList[current].kana.untyped;
            typedEn.textContent = wordObjList[current].roman.typed;
            untypedEn.textContent = wordObjList[current].roman.untyped;
            if(isFinish){
                // ライブラリのエラーにより、小文字が入るとkanaのtyped,untypedがずれるのに対応する。
                typedKana.textContent = wordObjList[current].kana.all;
                untypedKana.textContent = "";
                current += 1;
                wordCountText.textContent = current;
                if(current == wordLength){
                    // ゲームの終了
                    processEndGame()
                }
                else {
                    highlightCurrentPanel()
                    typedKana = document.getElementById(`kana_typed-${current}`);
                    untypedKana = document.getElementById(`kana_untyped-${current}`);
                    typedEn = document.getElementById(`en_typed-${current}`);
                    untypedEn = document.getElementById(`en_untyped-${current}`);
                    
                    if(current == wordLength/2){
                        secondFase()
                    }
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
        const scoreText = document.getElementById("score");
        
        const stopTime = (Date.now() - startTime);
        const score = parseInt(typeCount / stopTime * 60000 * (letterCount / typeCount) ** 3);
        scoreText.textContent = `SCORE : ${score}`;
        otherResult.textContent = `合計入力文字数（ミスを含む):${typeCount}`;
        resultSection.style.display = "flex";
        // 全パネルのハイライトを消す
        //全パネルを表示する機能を追加
        for (let i = 0; i < wordLength; i++) {
            const panel = document.getElementById("panel-" + i);
            if (panel) {
                panel.classList.remove("active","faded");
                panel.style.animation = "none";
                panel.style.display = 'flex'
            }    
        }
        //大きさ変更、スクロール変更
        panelContainer.style.height = '110vh'
        startFlag = 2
        window.scrollTo({
            top: 450,      // 縦スクロールの位置
            left: 0,     // 横スクロールの位置（通常は 0 のままでOK）
            behavior: "smooth"
        })
    }

    window.addEventListener("keydown", async (event) => {
        if(startFlag == 0 && event.key == " "){
            processStartGame()
        }
        else if(startFlag == 1 && event.key.length < 2 && event.key.match(/^[a-zA-Z0-9!-/:-@¥[-`{-~\s]*$/)){
            inputCheck(event.key);
        }else if(startFlag == 2 && (event.key =="Enter" || event.key == "Escape")){
            this.location.reload()
        }
    })
})