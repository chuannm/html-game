

$(() => {
    const $container = $('#game-container');
    const quizData = [
        {
            id: 1, title:'Quest1', content: "Câu hỏi 1", questions:[
                {point: 0, content: "Answer1"}, 
                {point: 0, content: "Answer2"}, 
                {point: 0, content: "Answer3"}, 
                {point: 5, content: "Answer4"}, 
            ]
        },
        {
            id: 1, title:'Quest2', content: "Câu hỏi 2", questions:[
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
        const $item = $(`<div id="${itemData.id}" class="question-container ui-widget ui-corner-all"></div>`)
        $item.append(`<div class="title">${itemData.title}</div>`)
        $item.append(`<div class="content">${itemData.content}</div>`)
        const $questionContainer = $(`<div class="answers-container ui-widget ui-corner-all"></div>`)
        $item.append($questionContainer);
        $item.markDone = false;
        for(let a of itemData.questions) {
            const $btn = $(`<button class="ui-widget ui-corner-all ui-button">${a.content}</button>`)
            $btn.button();
            $btn.click(() => {
                addPoint(a.point)
                $btn.append(`<span style="font-size: 12px; color: Dodgerblue;"><i class="fa-solid fa-check"></i>+${a.point}</span>`)
                $btn.off('click');
                $btn.addClass("answered")
            })
            $item.append($btn)
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
