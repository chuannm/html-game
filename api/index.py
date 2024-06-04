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
@app.route('/api/user_data/<user_id>', methods = ["GET", "POST"])
def user_data(user_id):
    if not user_id: return { "code": "400", "data": "BAD_REQUEST"}
    if request.method == 'POST':
        data = request.get_json(True)
        answered_data = data["answered_data"]
        name = data["name"]
        high_score = get_total_score(answered_data)
        sql = """INSERT INTO user_data (id, name, json_data, high_score) VALUES (%s, %s, %s, %s) 
            ON CONFLICT (id) DO UPDATE 
            SET 
                json_data = EXCLUDED.json_data, 
                high_score = GREATEST(EXCLUDED.high_score, (SELECT high_score FROM user_data WHERE id = EXCLUDED.id)), 
                update_time = NOW()
        """
        try:
            cursor = executeSQL(sql, [user_id, name, json.dumps(answered_data), high_score])
            closeDB()
        except Exception as e: 
            print (e)
            return { "code": "500", "data": "DATA ERROR"} 

    sql = "SELECT json_data::json, extract(epoch from update_time), high_score, extract(epoch from NOW()) FROM user_data WHERE id = %s"
    try:
        cursor = executeSQL(sql, [user_id,])
        row = cursor.fetchone()
        return {"data": None} if not row else {"data": { "answered": row[0], "time": row[1], "high_score": row[2], "now": row[3] } }
    except Exception as e:
        print (e)
        return { "code": "400", "data": "BAD_REQUEST"}
@app.route('/api/ranks')
def getRanks() :
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