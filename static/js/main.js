

$(() => {
    const API_TOKEN = '6993591131:AAHsLKMYZTk-HycIoCcUrUpvetRj127U0s8';
    const $container = $('#game-container');
    const COOL_DOWN_TIME = 0.01;
    var quizData = [];
    var answerData = {};
    var totalPoint = 0;
    var highscore = 0;
    var save_time = 0;
    var last_answer_is_correct = 1;
    var adjusted_sv_timer = 0;
    var userInfo = null;
    var questionIndex = -1;
    var needShuffleQuestion = true;

    function addPoint(point, asNew = false) {
        if (point <= 0) return;
        totalPoint += point;
        $('#total-score').text("Điểm: " + totalPoint);
        if (asNew) {
            $('#total-score').addClass('blink_me')
            setTimeout(() => $('#total-score').removeClass('blink_me'), 2000)
        }

        if (totalPoint > highscore) {
            highscore = totalPoint;
            $('#high-score').text("Cao nhất: " + highscore);
            if (asNew) {
                $('#high-score').addClass('blink_me')
                setTimeout(() => $('#high-score').removeClass('blink_me'), 2000)
            }
        }



    }

    function showMessage(title, content) {
        if ($('#dialog-alert').length == 0) {
            $('body').append('<div id="dialog-alert"></dialog>')
            $('#dialog-alert').dialog({autoOpen: false})
        }
        $('#dialog-alert').html(content);
        $('#dialog-alert').dialog('option','title', title);
        $('#dialog-alert').dialog('open');
    }
    function addItem(itemData, $gameContainer) {
        if (!itemData) return;
        const $item = $(`<div class="question-container ui-widget ui-corner-all" id="question-${itemData.id}"></div>`)
        //$item.append(`<div class="title">${itemData.title}<span class="point">Điểm: 0</span></div>`)
        $item.append(`<div class="content">${itemData.content}</div>`)
        const $answersContainer = $(`<div class="answers-container ui-widget ui-corner-all"></div>`)
        $item.append($answersContainer);
        $item.markDone = false;
        const answered = answerData?.[itemData.id];

        const setAnswer = (itemData, a, $btn, save = false) => {
            answerData[itemData.id] = a;
            save && saveUserData(a.point);
            addPoint(a.point, save)
            if (a.point > 0) {
                $('.title .point', $item).text(`Điểm: ${a.point}`)
                $btn.addClass("answered")
            } else {
                $btn.addClass("answered wrong")
            }
        }
        answers = [...itemData.answers].sort((a, b) => 0.5 - Math.random())
        for(let a of answers) {
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

        $gameContainer.append($item)
        return $item;
    }


    function loadUserData() {
        $.ajax('/api/get-quiz', {
            async: false,
            success: json => quizData = json
        });
        var saved = JSON.parse(localStorage.getItem("answeredData")) || {};
        $.ajax(`/api/user_data/${encodeURIComponent(userInfo.username)}`, {
            method: 'GET',
            async: false,
            success: resp => {
                console.log(resp);
                if (resp.data) {
                    saved = resp.data.answered;
                    highscore = resp.data.high_score;
                        last_answer_is_correct = resp.data.last_answer_is_correct;
                    save_time = resp.data.time;
                    questionIndex = resp.data.last_question_index;
                    adjusted_sv_timer = resp.data.now - Date.now() / 1000
                }
            }
        })

        // 15 minutes
        if (get_remaining_time() > 0) {
            answerData = saved;
        }
        const ids = Object.keys(answerData);


        if (get_remaining_time() < 0) {
            // quizData.sort((a, b) => {
            //     const ia = ids.indexOf(a.id + ''), ib = ids.indexOf(b.id + '')
            //     console.log('sort: {}, {}', ia, ib);
            //     if (ia >= 0) {
            //         return ib < 0 ? -1 : (ia - ib);
            //     }
            //     if (ib >= 0) return 1;
            //     return 0.5 - Math.random();
            // });
        }



        // questionIndex = ids.length == 0 ? 0 : quizData.findIndex(a => ids.indexOf(a.id + "") < 0);
        // if (questionIndex < 0) questionIndex = 0;

    }
    function saveUserData(point) {
        localStorage.setItem("answered_data", JSON.stringify(answerData));
        localStorage.setItem("ans_time", Date.now());
        console.log("point: " + point);
        const data = {answered_data: answerData, name: [userInfo.first_name, userInfo.last_name].join(' '), lastPoint: point}
        $.ajax(`/api/user_data/${encodeURIComponent(userInfo.username)}`, {
            method: 'POST',
            data: JSON.stringify(data),
            success: resp => {
                highscore = resp.data.high_score || highscore;
                save_time = resp.data.time;
                last_answer_is_correct = resp.data.last_answer_is_correct;
                adjusted_sv_timer = resp.data.now - Date.now() / 1000
                console.log("SaveTime:", save_time);
                console.log("adjusted_sv_timer:", adjusted_sv_timer);
                //setTimeout(() => showQuestion(questionIndex + 1), 1000);
                randomQuest();
                showQuestion(questionIndex);
            }
        })
    }

    function canPlay() {
        console.log("last_answer_is_correct: " + last_answer_is_correct);
        return last_answer_is_correct || get_remaining_time() < 0;
        //if (!answerData || !quizData) return true;
        //return Object.keys(answerData).length < quizData.length;
        //return last_answer;
    }

    function get_server_now() {
        return Date.now() / 1000 + adjusted_sv_timer;
    }
    function get_remaining_time() {
        return COOL_DOWN_TIME * 60 + Math.floor((save_time - get_server_now()))
    }


    function display_retry_time() {
        var remaining = get_remaining_time()
        console.log("remainingTime: " + remaining);
        console.log("save-time: " + save_time);
        if (remaining < 0 || last_answer_is_correct == 1) $('#count_down').text("")
        else {
            var minutes = Math.floor(remaining / 60);
            var hours = Math.floor(minutes / 60);
            minutes = minutes - hours * 60;
            var seconds = remaining % 60;
            var displayTime = [hours, minutes, seconds].map(n => String(n).padStart(2, 0)).join(":")
            $('#count_down').text(`Lượt tiếp theo: ${displayTime}`)
        }
        setTimeout(display_retry_time, 1000)
    }
    function createRankItem(rank, name, score, time) {
        let $row = $('<div class="rank_item"></div>');
        $row.append(`<span class="bxh_rank">${rank}</span>`);
        $row.append(`<span class="bxh_name">${name}</span>`);
        $row.append(`<span class="bxh_score">${score}</span>`);
        return $row;
    }
    function showRankingTable() {
        $.ajax('/api/ranks', {
            success: resp => {
                if (resp.code || !resp.data) {
                    $('#game-ranks').html('<h2>Bảng xếp hạng: Trống</h2>')
                    return;
                }
                $('#game-ranks').empty();
                $('#game-ranks').append(createRankItem("STT", "Tên", "Điểm", "Thời gian"))
                const ranks = resp.data;
                for(let i = 0, n = ranks.length; i < n; i++) {
                    let rank = ranks[i];
                    let time = new Date(Math.floor(rank.timed));
                    $('#game-ranks').append(createRankItem(i + 1, rank.name + "<br/>" + rank.id  , rank.score, time.toLocaleDateString() + " " + time.toLocaleTimeString()));
                }

            }
        })
    }
    function onTabChanged(event, ui) {
        if (ui.newPanel.is('#game-ranks')) showRankingTable();
    }

    function randomQuest(){
        questionIndex = Math.floor(Math.random() * (quizData.length - 1));
    }

    function showQuestion(index) {
        if (index < 0 || index >= quizData.length) return;
        const item = quizData[index];
        if (!item) return;
        $('.question-container', $container).hide();
        if (!canPlay()) {
            navText = "Hãy chờ cooldown để chơi lại."
            $('#txtNav').text(navText);
            return;
        }

        //$('#txtNav').text((questionIndex + 1)  + "/" + quizData.length)

        $question = $(`#question-${item.id}`);
        if ($question.length == 0) {
            return;
        }
        questionIndex = index;


        $question.show()
        $('.nav-questions #btnPrev').button('option', 'disabled', questionIndex < 1);
        $('.nav-questions #btnNext').button('option', 'disabled', questionIndex >= quizData.length - 1);

    }
    function main() {
        $('#game-canvas').tabs({ hide: { effect: "zoomOut", duration: 300 },show: { effect: "fadeIn", duration: 500 }, beforeActivate: onTabChanged });

        var url = new URL(location.href)
        var hasParams = new URLSearchParams(url.hash.substring(1))
        var appData = new URLSearchParams(hasParams.get('tgWebAppData'))

        const $header = $(`#game-header`);
        // userInfo = JSON.parse(appData.get('user'))
        // if (!userInfo) {
        //     return $header.html("<h2>Bạn chưa đăng nhập</h2>Vui lòng đăng nhập để chơi game!")
        // }
       userInfo = {"first_name": "duc", "last_name": "nguyen","username": "ducna"};

        loadUserData();

        const fullName = [userInfo.first_name, userInfo.last_name].join(' ') ;
        $header.append(`<div id="user-info" class="ui-widget ui-corner-all" >${fullName} (${userInfo.username})</div>`);
        $header.append(`<div id="count_down" class="header-score ui-widget ui-corner-all">Đếm ngược lần chơi tiếp theo</div>`);
        $header.append(`<div class="header-score">
            <div id="high-score">Điểm cao : ${highscore}</div>
            <div id="total-score" >Điểm: 0</div>
        </div>`);
        if (canPlay()) {
            for(let i = 0, n = quizData.length; i < n; i++) {
                // var idQuest = Math.floor(Math.random() * (quizData.length - 1));
                item = quizData[i];
                addItem(item, $container);
            }
            
        }
        display_retry_time();

        $nav = $('<div class="nav-questions"></div>')
        // $nav.append($('<button class="ui-button" id="btnPrev">Câu trước</button>').click(() => showQuestion(questionIndex-1)))
        $nav.append($('<span class="ui-nav-text" id="txtNav"></span>'))
        // $nav.append($('<button class="ui-button" id="btnNext">Câu sau</button>').click(() => showQuestion(questionIndex+1)))
        $container.append($nav)
        $('button', $nav).button();
        console.log("aaaa " + questionIndex)

        if (questionIndex == -1){
            randomQuest();
        }

        console.log(questionIndex)
        showQuestion(questionIndex);
    }
    main();
});
