import os
def readQuizJson():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quiz-data.json")
    with open(path, "r") as json_file: return json_file.read()