from flask import request, session, redirect
from .db import getDBCursor
from flask_bcrypt import Bcrypt
from .request_utils import getParam
from hashlib import md5
from time import time
bcrypt = Bcrypt()
API_USER = {
    "admin" : "dfd21e54-ebb6-4a9f-a7fa-3faca8379205",
    "app" : "2f320a40-a90b-4693-b41a-48d3dd1d2ffa",
}

def is_auth_required():
    api_user = get_api_user()
    if  api_user is not None: return False
    userInfo = session.get("authuser", default="").split("#")
    print("Check auth session: ", userInfo, len(userInfo))
    user = ""
    pwd = ""
    if (len(userInfo) == 2):
        user = userInfo[0]
        pwd = userInfo[1]
        print(" do login 1: " + user + ", pass: " + pwd)
    else :
        user = getParam("u", "")
        pwd = getParam("p", "")
        print(" do login 2: " + user + ", pass: " + pwd)
        
    if not user or not pwd: 
        print("auth required")
        if "/api/" not in request.url.lower(): return redirect("/login")
        return {"code" : 511, "data": "Auth required"}
    hashed_pwd = get_user_passwd(user)
    # sai tên hoặc id đăng nhập
    if not hashed_pwd: 
        if "/api/" not in request.url.lower(): return redirect("/login")
        return {"code" : 511, "data": "Auth required"}
    #  check password
    result = check_login_password(hashed_pwd, pwd)
    # sai password
    if not result: 
        if "/api/" not in request.url.lower(): return redirect("/login")
    # trả về đăng nhập thành công
    session["authuser"] = "#".join([user, pwd])

    return False


def get_user_passwd(user_name: str):
    if not user_name:        
        return False
    print ("get user pass with name:", user_name)
    cursor = getDBCursor()
    cursor.execute( "SELECT password FROM auth_user WHERE name = %s", [user_name])
    row = cursor.fetchone()
    return str(row[0]) if row is not None else False


def check_login_password(hased_pwd: str, password: str):
    global bcrypt
    print("check_login_password: ", hased_pwd, password)
    if not password or not hased_pwd:
        return False
    return bcrypt.check_password_hash(hased_pwd, password)

def get_api_user():
    token = request.headers.get("Authentication")
    request_time = request.headers.get("X-Request-Time")
    if not token or token.isspace(): return None
    if not request_time or request_time.isspace() : return None

    now = time()
    nTime = int(request_time)
    # quá 10p
    if abs(now - nTime) > 10 * 60: return None

    length = len(token)
    md5_time = token[0:10]
    md5_check_time = str(md5(request_time.encode()).hexdigest())
    print ('md5 time:', md5_time, md5_check_time)
    #hashed time failed
    if (not md5_check_time.startswith(md5_time)): return None
    secret = token[11:length - 11]
    md5_token = token[length-10:length]
    md5_check_token = str(md5(secret.encode()).hexdigest())
    print ('md5 token:', md5_token, md5_check_token)
    if not md5_check_token.startswith(md5_token): return None
    for k in API_USER:
        if (API_USER[k] == secret): return k
    return None

