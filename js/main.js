

$(() => {
    const $container = $('#game-container');
    const quizData = [
        {
            id:1, title:'Quest 1 title', content: "Câu hỏi 1", questions:[
                {id: 1, point: 0, content: "Answer1"}, 
                {id: 2, point: 0, content: "Answer2"}, 
                {id: 3, point: 0, content: "Answer3"}, 
                {id: 4, point: 5, content: "Answer4"}, 
            ]
        },
        {
            id: 2, title:'Quest 2 title', content: "Câu hỏi 2", questions:[
                {id: 1, point: 0, content: "Answer1"}, 
                {id: 2, point: 5, content: "Answer2"}, 
                {id: 3, point: 0, content: "Answer3"}, 
                {id: 4, point: 0, content: "Answer4"}, 
            ]
        }
    ]
    var answerData = {};
    var totalPoint = 0;
    function addPoint(point) {
        totalPoint += point;
        $('#total-score', $container).text("Score: " + totalPoint);
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
        for(let a of itemData.questions) {
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
        const items = JSON.parse(localStorage.getItem("answeredData"));
        const time = localStorage.getItem("ans_time")
        // 15 minutes 
        if (!items || !time || time >= Date.now() /1000 + 15 + 60) return;
        answerData = items;

    }
    function saveUserData() {
        localStorage.setItem("answeredData", JSON.stringify(answerData));
        localStorage.setItem("ans_time", Date.now() / 1000);
    }


    function main() {
        $('#debugger').text(location.href);
        loadUserData();
        $container.empty();
        $container.append(`<div id="total-score" class="header-score ui-widget ui-corner-all" >Score: 0</div`);
        for(var item of quizData) {
            addItem(item);
        }

    
    }
    main();
});
