

$(() => {
    const $container = $('#game-container');
    const quizData = [
        {
            title:'Quest 1 title', content: "Câu hỏi 1", questions:[
                {point: 0, content: "Answer1"}, 
                {point: 0, content: "Answer2"}, 
                {point: 0, content: "Answer3"}, 
                {point: 5, content: "Answer4"}, 
            ]
        },
        {
            title:'Quest 2 title', content: "Câu hỏi 2", questions:[
                {point: 0, content: "Answer1"}, 
                {point: 0, content: "Answer2"}, 
                {point: 0, content: "Answer3"}, 
                {point: 5, content: "Answer4"}, 
            ]
        }
    ]
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
        for(let a of itemData.questions) {
            const $btn = $(`<button class="ui-widget ui-corner-all ui-button">${a.content}</button>`)
            $btn.button();
            $btn.click(() => {
                addPoint(a.point)
                if (a.point > 0) {
                    $('.title .point', $item).text(`Điểm: ${a.point}`)
                    $btn.addClass("answered")
                } else {
                    $btn.addClass("answered wrong")
                }
                $('button', $item).off('click').button('option', '`disabled`', true);
                
            })
            $answersContainer.append($btn)
        }

        $container.append($item)
    }





    function main() {
        $container.empty();
        $container.append(`<div id="total-score" class="header-score ui-widget ui-corner-all" >Score: 0</div`);
        for(var item of quizData) {
            addItem(item);
        }
    }
    main();
});
