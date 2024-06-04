

$(() => {
    const API_TOKEN = '6993591131:AAHsLKMYZTk-HycIoCcUrUpvetRj127U0s8';
    const $container = $('#game-container');
    var quizData = [];
    var answerData = {};
    var totalPoint = 0;
    var highscore = 0;
    var save_time = 0;
    var adjusted_sv_timer = 0;
    var userInfo = null;
    function addPoint(point, asNew = false) {
        if (point <= 0) return;
        totalPoint += point;
        $('#total-score').text("Tổng điểm: " + totalPoint);
        if (asNew) {
            $('#total-score').addClass('blink_me')
            setTimeout(() => $('#total-score').removeClass('blink_me'), 2000)
        }

        if (totalPoint > highscore) {
            highscore = totalPoint;
            $('#high-score').text("Điểm cao: " + highscore);
            if (asNew) {
                $('#high-score').addClass('blink_me')
                setTimeout(() => $('#high-score').removeClass('blink_me'), 2000)
            }
        }
        
        
        
    }

    function addItem(itemData, $gameContainer) {
        if (!itemData) return;
        const $item = $(`<div class="question-container ui-widget ui-corner-all"></div>`)
        $item.append(`<div class="title">${itemData.title}<span class="point">Điểm: 0</span></div>`)
        $item.append(`<div class="content">${itemData.content}</div>`)
        const $answersContainer = $(`<div class="answers-container ui-widget ui-corner-all"></div>`)
        $item.append($answersContainer);
        $item.markDone = false;
        const answered = answerData?.[itemData.id];

        const setAnswer = (itemData, a, $btn, save = false) => {
            answerData[itemData.id] = a;
            save && saveUserData();
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
    }


    function loadUserData() {
        $.ajax('/api/get-quiz', {
            async: false,
            success: json => quizData = json
        });
        var saved = JSON.parse(localStorage.getItem("answeredData")) || {};
        var time = localStorage.getItem("ans_time")
        $.ajax(`/api/user_data/${encodeURIComponent(userInfo.username)}`, {
            method: 'GET',
            async: false,
            success: resp => {
                console.log(resp);
                if (resp.data) {
                    saved = resp.data.answered;
                    highscore = resp.data.high_score
                    save_time = resp.data.time;
                    adjusted_sv_timer = resp.data.now - Date.now() / 1000

                }
                
            }
        })
        
        // 15 minutes 
        if (get_remaining_time() > 0) {
            answerData = saved;
        }
    }
    function getScore(ans_data) {
        let score = 0;
        for (let qid in ans_data) {
            score += ans_data[qid]?.point || 0;
        }
        return score;
    }
    function saveUserData() {
        localStorage.setItem("answered_data", JSON.stringify(answerData));
        localStorage.setItem("ans_time", Date.now());
        const data = {answered_data: answerData, name: [userInfo.first_name, userInfo.last_name].join(' ')}
        $.ajax(`/api/user_data/${encodeURIComponent(userInfo.username)}`, {
            method: 'POST',
            data: JSON.stringify(data),
            success: resp => {
                highscore = resp.data.high_score || highscore;
                save_time = resp.data.time;
                adjusted_sv_timer = resp.data.now - Date.now() / 1000
                console.log("SaveTime:", save_time);
                console.log("adjusted_sv_timer:", adjusted_sv_timer);

            }
        })
    }

    function get_server_now() {
        return Date.now() / 1000 + adjusted_sv_timer;
    }
    function get_remaining_time() {
        return 15 * 60 + Math.floor((save_time - get_server_now())) 
    }
    function display_retry_time() {
        var remaining = get_remaining_time()
        if (remaining < 0) $('#count_down').text("")
        else {
            var minutes = String(Math.floor(remaining / 60)).padStart(2, 0);
            var seconds = String(remaining % 60).padStart(2, 0);
            $('#count_down').text(`${minutes}:${seconds}`)
        }
        setTimeout(display_retry_time, 1000)
    }

    function showRankingTable() {
        if (!$('#game-ranks').is(':has(#ranks-content)')) {
            $('#game-ranks').append('<div id="ranks-content"></div>');
        }
        $.ajax('/api/ranks', {
            success: resp => {
                if (resp.code || !resp.data) {
                    $('#ranks-content').html('<h2>Bảng xếp hạng: Trống</h2>')
                    return;
                }
                $('#ranks-content').empty();
                const ranks = resp.data;
                for(let i = 0, n = ranks.length; i < n; i++) {
                    let rank = ranks[i];
                    let time = new Date(Math.floor(rank.timed));
                    let $row = $('<div class="rank_item"></div>');
                    $row.append(`<span class="bxh_rank">${i+1} - </span>`);
                    $row.append(`<span class="bxh_name">${rank.name} (${rank.id})</span>`);
                    $row.append(`<span class="bxh_score">Điểm: ${rank.score}</span>`);
                    $row.append(`<span class="bxh_timed"">${time.toLocaleDateString()} ${time.toLocaleTimeString()}</span>`)
                    $('#ranks-content').append($row);
                }

            }
        })
    }
    function onTabChanged(event, ui) {
        console.log('onTabChanged', ui)
        if (ui.newPanel.is('#game-ranks')) showRankingTable();
    }
    function main() {
        $('#game-canvas').tabs({ hide: { effect: "zoomOut", duration: 300 },show: { effect: "fadeIn", duration: 500 }, beforeActivate: onTabChanged });

        var url = new URL(location.href)
        var hasParams = new URLSearchParams(url.hash.substring(1))
        var appData = new URLSearchParams(hasParams.get('tgWebAppData'))
        userInfo = JSON.parse(appData.get('user'))
        $container.empty();
        if (!userInfo) {
            return $container.html("<h2>Bạn chưa đăng nhập</h2>Vui lòng đăng nhập để chơi game!")
        }
        
        loadUserData();
        const fullName = [userInfo.first_name, userInfo.last_name].join(' ') ;
        const $header = $(`<div id="game-header"></div>`), $body = $('<div id="game-content"></div>')
        $header.append(`<div id="user-info" class="ui-widget ui-corner-all" >Người chơi: ${fullName} (${userInfo.username})</div>`);
        $header.append(`<div id="count_down" class="header-score ui-widget ui-corner-all">Đếm ngược lần chơi tiếp theo</div>`);
        $header.append(`<div id="high-score" class="header-score ui-widget ui-corner-all" >Điểm cao: ${highscore}</div>`);
        $header.append(`<div id="total-score" class="header-score ui-widget ui-corner-all" >Điểm: 0</div>`);
        $container.append($header, $body);
        for(var item of quizData) {
            addItem(item, $body);
        }
        display_retry_time();
    
        

    }
    main();
});
