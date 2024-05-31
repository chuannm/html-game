

$(() => {
    const API_TOKEN = '6993591131:AAHsLKMYZTk-HycIoCcUrUpvetRj127U0s8';
    const $container = $('#game-container');
    var quizData = [];
    var answerData = {};
    var totalPoint = 0;
    function addPoint(point) {
        totalPoint += point;
        $('#total-score').text("Tổng điểm: " + totalPoint);
    }

    function addItem(itemData) {
        if (!itemData) return;
        const $item = $(`<div class="question-container ui-widget ui-corner-all"></div>`)
        $item.append(`<div class="title">${itemData.title}<span class="point">Điểm: 0</span></div>`)
        $item.append(`<div class="content">${itemData.content}</div>`)
        const $answersContainer = $(`<div class="answers-container ui-widget ui-corner-all"></div>`)
        $item.append($answersContainer);
        $item.markDone = false;
        const answered = answerData[itemData.id];

        const setAnswer = (itemData, a, $btn, save = false) => {
            answerData[itemData.id] = a;
            save && saveUserData();
            addPoint(a.point)
            if (a.point > 0) {
                $('.title .point', $item).text(`Điểm: ${a.point}`)
                $btn.addClass("answered")
            } else {
                $btn.addClass("answered wrong")
            }
        }
        questions = [...itemData.questions].sort((a, b) => 0.5 - Math.random())
        for(let a of questions) {
            const $btn = $(`<button class="ui-widget ui-corner-all ui-button">${a.content}</button>`)
            $btn.button();
            if (answered) {
                if (answered.id == a.id) {
                    setAnswer(itemData, a, $btn)
                }
            } else {
                $btn.click(() => {
                    setAnswer(itemData, a, $btn, true)
                    $('button', $item).off('click').button('option', '`disabled`', true);
                })
            }
            $answersContainer.append($btn)
        }
        $container.append($item)
    }


    function loadUserData() {
        $.ajax('questions.json', {
            async: false,
            success: json => quizData = json
        });
        const items = JSON.parse(localStorage.getItem("answeredData"));
        const time = localStorage.getItem("ans_time")
        // 15 minutes 
        if (!items || !time || time < Date.now() /1000 - (15 * 60)) return;
        answerData = items;

    }
    function saveUserData() {
        localStorage.setItem("answeredData", JSON.stringify(answerData));
        localStorage.setItem("ans_time", Date.now() / 1000);
    }


    async function main() {
        var url = new URL(location.href)
        var hasParams = new URLSearchParams(url.hash.substring(1))
        var appData = new URLSearchParams(hasParams.get('tgWebAppData'))
        var userInfo = JSON.parse(appData.get('user'))

        await loadUserData();
        $container.empty();
        $container.append(`<div id="total-score" class="header-score ui-widget ui-corner-all" >Điểm: 0</div>`);
        for(var item of quizData) {
            addItem(item);
        }
        $('#game-canvas').tabs();
    
    }
    main();
});
