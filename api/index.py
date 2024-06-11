import datetime
import os, json
from time import time
from math import floor
from flask import Flask, redirect, render_template, request
from .common.request_utils import getParam
from .common.db import executeSQL, closeDB

app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.secret_key = "$3CR3TKE1"


@app.route('/')
def home():
    return render_template("index.html")


@app.route('/api/get-quiz/')
def readQuizJson():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quiz-data.json")
    with open(path, "r") as json_file: return json.loads(json_file.read())


@app.route('/api/user_data/<user_id>', methods=["GET", "POST"])
def user_data(user_id):
    if not user_id: return {"code": "400", "data": "BAD_REQUEST"}
    if request.method == 'POST':
        data = request.get_json(True)
        answered_data = data["answered_data"]
        last_point = data["lastPoint"]
        name = data["name"]
        high_score = get_total_score(answered_data)
        last_answer_is_correct = 1 if last_point > 0 else 0
        print("last_answer_is_correct: ", last_answer_is_correct)
        sql = """INSERT INTO user_data (id, name, json_data, high_score, last_answer_is_correct) 
        VALUES (%s, %s, %s, %s,%s ) 
            ON CONFLICT (id) DO UPDATE 
            SET 
                json_data = EXCLUDED.json_data, 
                high_score = GREATEST(EXCLUDED.high_score, (SELECT high_score FROM user_data WHERE id = EXCLUDED.id)), 
                last_answer_is_correct = EXCLUDED.last_answer_is_correct,
                update_time = NOW()
        """
        try:
            cursor = executeSQL(sql, [user_id, name, json.dumps(answered_data), high_score, last_answer_is_correct])
        except Exception as e:
            print(e)
            return {"code": "500", "data": "DATA ERROR"}

    sql = "SELECT json_data::json, extract(epoch from update_time), high_score, last_answer_is_correct," \
          " extract(epoch from NOW()) FROM user_data WHERE id = %s"
    try:
        cursor = executeSQL(sql, [user_id, ])
        row = cursor.fetchone()
        return {"data": None} if not row else {
            "data": {"answered": row[0], "time": row[1], "high_score": row[2], "last_answer_is_correct": row[3],
                     "last_question_index": row[4], "now": row[5]}}
    except Exception as e:
        print(e)
        return {"code": "400", "data": "BAD_REQUEST"}
    finally:
        closeDB(True)


@app.route('/api/ranks')
def getRanks():
    sql = "SELECT id, name, extract(epoch from update_time) * 1000, high_score FROM user_data ORDER BY high_score DESC, update_time DESC LIMIT 100"
    cursor = executeSQL(sql, [])
    records = [{"id": row[0], "name": row[1], "timed": int(row[2]), "score": int(row[3])} for row in cursor.fetchall()]
    return {"data": records}


def get_total_score(answered_data):
    score = 0
    for key in answered_data:
        a = answered_data[key]
        score += a['point']
    return score


def get_last_answer_is_correct(answered_data):
    # return 1 if last answer point > 0 else 0
    return 1 if answered_data[list(answered_data.keys())[-1]]['point'] > 0 else 0
