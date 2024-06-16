import os, json, random
from time import time
from math import floor
from flask import Flask, redirect, render_template, request
from .common.request_utils import getParam
from .common.db import executeSQL, closeDB
from .common import utils
import traceback 

quiz_data = utils.read_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "quiz-data.json")) or []
random_seed = utils.read_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "user-seed.json")) or {}
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
        utils.write_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), "user-seed.json"), random_seed)
        save_start_time(user_id=user_id)
    
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
        saveUserData(user_id, name, answered_data, high_score, last_question_index)
    # do get data.
    sql = "SELECT json_data::json, extract(epoch from update_time), high_score, extract(epoch from NOW()), last_question_index FROM user_data WHERE id = %s"
    try:
        while True:
            cursor = executeSQL(sql, [user_id,])
            row = cursor.fetchone()
            data = {"data": None} if not row else {"data": { "answered": row[0], "time": row[1], "high_score": row[2], "now": row[3], "last_question_index": row[4]} }
            if data['data'] is None: break
            print("selected data:", data)
            if is_question_timeout(data["data"]): nextQuestion(user_id)
            else: return data
    except Exception as e:
        traceback.print_exception (value=e, tb = None)
    finally:
        closeDB(True)
    now = getNow()
    return {"data": { "answered": [], "time": now, "high_score": 0, "now": now, "last_question_index": 0} }

@app.route('/api/ranks')
def getRanks() :
        sql = "SELECT id, name, extract(epoch from (update_time - start_time)) as play_time, high_score FROM user_data ORDER BY high_score DESC, play_time LIMIT 100;"
        cursor = executeSQL(sql, [])
        records = [{"id": row[0], "name": row[1], "timed": int(row[2]), "score": int(row[3])} for row in cursor.fetchall()]
        return {"data": records}

def save_start_time(user_id, name="tmp"):
    print("Saving start_time:",  user_id)
    if not user_id: return { "code": "400", "data": "BAD_REQUEST"}
    
    sql = """INSERT INTO user_data (id, json_data, name) VALUES (%s, %s, %s) 
            ON CONFLICT (id) DO UPDATE 
            SET 
                start_time = NOW(),
                name = EXCLUDED.name,
                json_data = EXCLUDED.json_data
        """
    try:
        cursor = executeSQL(sql, [user_id, json.dumps({}), name])
        return { "code": "200", "data": "SUCCESS"}
    except Exception as e: 
        traceback.print_exception (e)
        return { "code": "500", "data": "DATA ERROR"}
    finally:
        # commit db;
        closeDB(True)

def get_total_score(answered_data):
    score = 0
    for key in answered_data:
        a = answered_data[key]
        score += a['point']
    return score


def get_remaining_time(save_time, now):
    
    r = 60 + save_time - now
    print ('remaning time', r)
    return r
def is_question_timeout(data):
    return get_remaining_time(data["time"], data["now"]) < 0
    


def saveUserData(user_id, name, answered_data, high_score, last_question_index):
    sql = """INSERT INTO user_data (id, name, json_data, high_score, last_question_index) VALUES (%s, %s, %s, %s, %s) 
            ON CONFLICT (id) DO UPDATE 
            SET 
                name = EXCLUDED.name,
                json_data = EXCLUDED.json_data, 
                high_score = GREATEST(EXCLUDED.high_score, (SELECT high_score FROM user_data WHERE id = EXCLUDED.id)), 
                update_time = NOW(),
                last_question_index = EXCLUDED.last_question_index
        """
    try:
        executeSQL(sql, [user_id, name, json.dumps(answered_data), high_score, last_question_index])
    except Exception as e: 
        traceback.print_exception (value=e, tb = None)
        return { "code": "500", "data": "DATA ERROR"} 
    finally:
        closeDB(True)
#DO: next question on timeout or answered
def nextQuestion(user_id):
    try:
        executeSQL("UPDATE user_data SET last_question_index = last_question_index + 1, update_time = NOW() WHERE id = %s", [user_id,])
    except Exception as e: 
        traceback.print_exception (value=e, tb = None)
        return { "code": "500", "data": "DATA ERROR"} 
    finally:
        closeDB(True)


def getNow():
    try:
        cursor = executeSQL("SELECT extract(epoch FROM NOW())")
        return cursor.fetchone()[0]
    except Exception as e:
        traceback.print_exception (value=e, tb = None)
    return time()