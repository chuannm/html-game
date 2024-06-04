from flask import request
def getParam(name: str, default = None) -> str:
    data = request.values.get(name)
    if not data and request.is_json:
        data = request.json[name]
    return data or default
def getListParam(name: str, default = None):
    return request.values.getlist(name, default)
def getPageIndex():
    page = int(getParam('pi', 1)) - 1
    return 0 if (page < 0) else page
def getPageSize(default = 20) :
    count = int(getParam("ps", default))
    return default if (count < 1) else count
def getSkip(size = 20):
    return size * getPageIndex() 

