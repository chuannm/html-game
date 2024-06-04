import psycopg2
import os
__connection__ = None
def getConnection():
    global __connection__
    if __connection__ == None or __connection__.closed != 0:
        __connection__ = psycopg2.connect (
            host = os.environ.get('POSTGRES_HOST'),
            dbname = os.environ.get('POSTGRES_DATABASE'),
            user = os.environ.get('POSTGRES_USER'),
            password = os.environ.get('POSTGRES_PASSWORD'),
            port = os.environ.get('POSTGRES_PORT'),
        )
    return __connection__
def getDBCursor(): return getConnection().cursor()
def executeSQL(sql: str, params: any):
    cursor = getDBCursor()
    print ("sql: {}, {} ".format(sql, params))
    cursor.execute(sql, params)
    return cursor

def closeDB(commit=True):
    global __connection__
    if __connection__ != None and __connection__.closed == 0:
        if commit:
            __connection__.commit()
        __connection__.close()
        __connection__ = None


def init():
    sql_script = ""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ddl.sql")
    with open(path, "r") as sql_file:
        sql_script = sql_file.read()
    if sql_script == "":
        return
    getDBCursor().execute(sql_script)
    closeDB()
init()

