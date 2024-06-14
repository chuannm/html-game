import os, json, random
from time import time
from math import floor
from flask import Flask, redirect, render_template, request
from .common.request_utils import getParam
from .common.db import executeSQL, closeDB

from .common import utils

quiz_data = utils.read_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "quiz-data.json"))
random_seed = utils.read_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_seed.json"))
idx_list = list(range(0, len(quiz_data)))


app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.secret_key = "$3CR3TKE1"
@app.route('/')
def home():
    return render_template("index.html")
    
@app.route('/api/get-quiz/<user_id>')
def readQuizJson(user_id):
    if user_id not in random_seed.keys():
        seed = random.randint(1, 100000) 
        random_seed.update({user_id: seed})
        print(random_seed)
        utils.write_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_seed.json"), random_seed)
    
    else:
        seed = random_seed[user_id]
    
    random_idx = utils.shuffle_list_with_seed(idx_list.copy(), seed)
    
    return [quiz_data[i] for i in random_idx]

@app.route('/api/user_data/<user_id>', methods = ["GET", "POST"])
def user_data(user_id):
    if not user_id: return { "code": "400", "data": "BAD_REQUEST"}
    if request.method == 'POST':
        data = request.get_json(True)
        answered_data = data["answered_data"]
        name = data["name"]
        last_question_index = data["last_question_index"]
        high_score = get_total_score(answered_data)
        sql = """INSERT INTO user_data (id, name, json_data, high_score, last_question_index) VALUES (%s, %s, %s, %s, %s) 
            ON CONFLICT (id) DO UPDATE 
            SET 
                json_data = EXCLUDED.json_data, 
                high_score = GREATEST(EXCLUDED.high_score, (SELECT high_score FROM user_data WHERE id = EXCLUDED.id)), 
                update_time = NOW(),
                last_question_index = EXCLUDED.last_question_index
        """
        try:
            cursor = executeSQL(sql, [user_id, name, json.dumps(answered_data), high_score, last_question_index])
        except Exception as e: 
            print (e)
            return { "code": "500", "data": "DATA ERROR"} 

    sql = "SELECT json_data::json, extract(epoch from update_time), high_score, extract(epoch from NOW()), last_question_index FROM user_data WHERE id = %s"
    try:
        cursor = executeSQL(sql, [user_id,])
        row = cursor.fetchone()
        return {"data": None} if not row else {"data": { "answered": row[0], "time": row[1], "high_score": row[2], "now": row[3], "last_question_index": row[4] } }
    except Exception as e:
        print (e)
        return { "code": "400", "data": "BAD_REQUEST"}
    finally:
        closeDB(True)
@app.route('/api/ranks')
def getRanks() :
        sql = "SELECT id, name, (start_time - update_time) * 1000 as play_time, high_score FROM user_data ORDER BY high_score DESC, play_time DESC LIMIT 100;"
        cursor = executeSQL(sql, [])
        records = [{"id": row[0], "name": row[1], "timed": -int(row[2]), "score": int(row[3])} for row in cursor.fetchall()]
        return {"data": records}

def get_total_score(answered_data):
    score = 0
    for key in answered_data:
        a = answered_data[key]
        score += a['point']
    return score